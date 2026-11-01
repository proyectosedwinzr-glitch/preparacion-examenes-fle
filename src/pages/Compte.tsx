import { useState } from "react";
import { backend } from "../lib/instance";
import { abonnementValide } from "../lib/backend";
import { useProfil } from "../lib/hooks";
import type { LangueIA } from "../lib/types";
import { dateFr } from "../lib/util";
import { Badge } from "../components/ui";

const LANGUES: Record<LangueIA, string> = { fr: "Français", es: "Español", en: "English", pt: "Português" };

export default function Compte() {
  const { profil, setProfil } = useProfil();
  const [nom, setNom] = useState(profil.nom);
  const [msg, setMsg] = useState("");
  const valide = abonnementValide(profil);

  return (
    <div className="pile">
      <h1>Mon compte</h1>
      <section className="carte">
        <h2>Profil</h2>
        <p>{profil.email} · <Badge ton="info">{profil.role === "eleve" ? "Élève" : "Professeur"}</Badge></p>
        <form className="ligne-form" onSubmit={async (e) => { e.preventDefault(); setProfil(await backend.majProfil({ nom })); setMsg("Profil mis à jour."); }}>
          <input value={nom} onChange={(e) => setNom(e.target.value)} aria-label="Nom" />
          <button className="btn">Enregistrer</button>
        </form>
        {msg && <p className="succes">{msg}</p>}
      </section>

      {profil.role === "eleve" && (
        <section className="carte">
          <h2>Langue des explications de l’IA</h2>
          <p className="petit">L’application reste en français. Ce réglage change seulement la langue des explications du tuteur, des corrections et du plan ; les exemples restent en français.</p>
          <div className="choix-langue">
            {(Object.keys(LANGUES) as LangueIA[]).map((l) => (
              <button key={l} className={`btn ${profil.langueIA === l ? "" : "secondaire"}`} onClick={async () => setProfil(await backend.majProfil({ langueIA: l }))}>
                {LANGUES[l]}
              </button>
            ))}
          </div>
        </section>
      )}

      <section className="carte">
        <h2>Abonnement</h2>
        <p>
          Statut : <Badge ton={valide ? "ok" : "attention"}>{profil.abonnement === "essai" ? "Essai gratuit" : profil.abonnement === "actif" ? "Actif" : "Expiré"}</Badge>
          {" "}· jusqu’au {dateFr(profil.abonnementFin)}
        </p>
        <p className="petit">
          Un accès actif est nécessaire pour créer ou accepter un lien élève–professeur et pour utiliser l’IA.
          Tremplin ne prend aucune commission sur vos cours : chacun paie seulement son propre accès aux outils.
        </p>
        <button className="btn" disabled title="Paiement en ligne bientôt disponible">S’abonner (bientôt disponible)</button>
      </section>

      <button className="btn secondaire" onClick={() => backend.deconnexion()}>Se déconnecter</button>
    </div>
  );
}
