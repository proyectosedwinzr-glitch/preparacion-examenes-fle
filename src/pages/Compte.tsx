import { useState } from "react";
import { backend } from "../lib/instance";
import { abonnementValide } from "../lib/backend";
import { CODES_DEMO } from "../lib/localBackend";
import { useProfil } from "../lib/hooks";
import type { LangueIA } from "../lib/types";
import { dateFr, jourLocal, joursAvant, telechargerJson } from "../lib/util";
import { definirVitesse, vitesse } from "../lib/voix";
import { Badge } from "../components/ui";

const LANGUES: Record<LangueIA, string> = { fr: "Français", es: "Español", en: "English", pt: "Português" };
const VITESSES = [0.8, 0.9, 1, 1.1];

export default function Compte() {
  const { profil, setProfil } = useProfil();
  const [nom, setNom] = useState(profil.nom);
  const [msg, setMsg] = useState("");
  const [code, setCode] = useState("");
  const [msgCode, setMsgCode] = useState<{ ok: boolean; t: string }>();
  const [v, setV] = useState(vitesse());
  const [confirmation, setConfirmation] = useState("");
  const [erreur, setErreur] = useState("");
  const valide = abonnementValide(profil);
  const reste = joursAvant(profil.abonnementFin.slice(0, 10));
  const eleve = profil.role === "eleve";

  async function activer(e: React.FormEvent) {
    e.preventDefault();
    try {
      const p = await backend.utiliserCode(code);
      setProfil(p);
      setCode("");
      setMsgCode(abonnementValide(p) ? { ok: true, t: `Code accepté : accès actif jusqu’au ${dateFr(p.abonnementFin)}.` } : { ok: false, t: "Code de démonstration : votre accès est maintenant expiré." });
    } catch (x) {
      setMsgCode({ ok: false, t: (x as Error).message });
    }
  }

  async function exporter() {
    setErreur("");
    try {
      const [liens, devoirs] = await Promise.all([backend.liens(), backend.devoirs()]);
      const contacts = liens.filter((l) => l.statut === "actif").map((l) => (eleve ? l.professeurId : l.eleveId)).filter((x): x is string => !!x);
      const messages = Object.fromEntries(await Promise.all(contacts.map(async (id) => [id, await backend.conversation(id)] as const)));
      const propres = eleve ? { resultats: await backend.tentatives(profil.id), plan: await backend.plan(profil.id) } : {};
      telechargerJson(`tremplin-mes-donnees-${jourLocal()}.json`, { exporteLe: new Date().toISOString(), profil, liens, devoirs, messages, ...propres });
    } catch (x) {
      setErreur((x as Error).message);
    }
  }

  async function supprimer() {
    setErreur("");
    try {
      await backend.supprimerCompte();
    } catch (x) {
      setErreur((x as Error).message);
    }
  }

  return (
    <div className="pile">
      <h1>Mon compte</h1>
      <section className="carte">
        <h2>Profil</h2>
        <p>{profil.email} · <Badge ton="info">{eleve ? "Élève" : "Professeur"}</Badge></p>
        <form className="ligne-form" onSubmit={async (e) => { e.preventDefault(); setProfil(await backend.majProfil({ nom })); setMsg("Profil mis à jour."); }}>
          <input value={nom} onChange={(e) => setNom(e.target.value)} aria-label="Prénom et nom" />
          <button className="btn">Enregistrer</button>
        </form>
        {msg && <p className="succes" role="status">{msg}</p>}
      </section>

      <section className="carte">
        <h2>Accès</h2>
        <p>
          Statut : <Badge ton={valide ? "ok" : "attention"}>{profil.abonnement === "essai" && valide ? "Essai gratuit" : valide ? "Actif" : "Expiré"}</Badge>{" "}
          {valide ? <>jusqu’au {dateFr(profil.abonnementFin)}{reste >= 0 && reste <= 7 && <span className="texte-alerte"> (plus que {reste} jour{reste > 1 ? "s" : ""})</span>}</> : <>depuis le {dateFr(profil.abonnementFin)}</>}
        </p>
        <p className="petit">
          Un accès actif permet d’enregistrer vos résultats, d’utiliser l’IA et de rester lié {eleve ? "à votre professeur" : "à vos élèves"}.
          Tremplin ne prend aucune commission sur les cours : chacun paie seulement son propre accès.
        </p>
        <form className="ligne-form" onSubmit={activer}>
          <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="TR-XXXXX-XXXXX" aria-label="Code d’activation" autoCapitalize="characters" required />
          <button className="btn">Activer le code</button>
        </form>
        {msgCode && <p className={msgCode.ok ? "succes" : "erreur"} role="status">{msgCode.t}</p>}
        <p className="petit">
          Les codes d’activation s’achètent auprès de votre professeur ou de l’éditeur de Tremplin ; chaque code ajoute une durée d’accès à la fin de l’accès en cours.
          {backend.mode === "demo" && <> En démonstration, essayez : {Object.keys(CODES_DEMO).join(", ")} (le dernier simule un accès expiré).</>}
        </p>
      </section>

      <section className="carte">
        <h2>Préférences</h2>
        {eleve && (
          <>
            <h3>Langue des explications de l’IA</h3>
            <p className="petit">L’application reste en français. Ce réglage change la langue des explications du tuteur, des corrections et du plan ; les exemples restent en français.</p>
            <div className="choix-langue">
              {(Object.keys(LANGUES) as LangueIA[]).map((l) => (
                <button key={l} className={`btn ${profil.langueIA === l ? "" : "secondaire"}`} aria-pressed={profil.langueIA === l} onClick={async () => setProfil(await backend.majProfil({ langueIA: l }))}>
                  {LANGUES[l]}
                </button>
              ))}
            </div>
          </>
        )}
        <h3>Vitesse des documents sonores</h3>
        <div className="choix-langue">
          {VITESSES.map((x) => (
            <button key={x} className={`btn ${v === x ? "" : "secondaire"}`} aria-pressed={v === x} onClick={() => { setV(x); definirVitesse(x); }}>
              {x === 1 ? "Normale" : x < 1 ? `Plus lente (×${x})` : `Plus rapide (×${x})`}
            </button>
          ))}
        </div>
      </section>

      <section className="carte">
        <h2>Mes données</h2>
        <p className="petit">Téléchargez une copie de vos données (profil, résultats, devoirs, messages), ou supprimez définitivement votre compte.</p>
        <div className="actions">
          <button className="btn secondaire" onClick={exporter}>Télécharger mes données</button>
          <a href="#/legal" className="btn-lien">Conditions d’utilisation et confidentialité</a>
        </div>
        <div className="zone-danger">
          <h3>Supprimer mon compte</h3>
          <p className="petit">Tous vos résultats, devoirs, messages et liens seront effacés. Cette action est définitive. Tapez SUPPRIMER pour confirmer.</p>
          <div className="ligne-form">
            <input value={confirmation} onChange={(e) => setConfirmation(e.target.value)} aria-label="Confirmation de suppression" placeholder="SUPPRIMER" />
            <button className="btn attention-btn" disabled={confirmation.trim() !== "SUPPRIMER"} onClick={supprimer}>Supprimer définitivement</button>
          </div>
        </div>
        {erreur && <p className="erreur" role="alert">{erreur}</p>}
      </section>

      <button className="btn secondaire" onClick={() => backend.deconnexion()}>Se déconnecter</button>
    </div>
  );
}
