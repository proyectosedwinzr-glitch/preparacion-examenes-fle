import { useState } from "react";
import { backend } from "../lib/instance";
import { useDonnee, useProfil } from "../lib/hooks";
import type { Lien, Profil } from "../lib/types";
import { copier, dateFr } from "../lib/util";
import { Badge, Vide } from "../components/ui";

function texteInvitation(p: Profil, email: string): string {
  const url = window.location.origin + window.location.pathname;
  return p.role === "eleve"
    ? `Bonjour,\n\nJe prépare mon examen de français sur Tremplin FLE et j’aimerais que vous suiviez mes progrès.\n1. Ouvrez ${url}\n2. Choisissez « Professeur » et connectez-vous avec cette adresse : ${email}\n3. Acceptez mon invitation dans « Invitations ».\n\nMerci !\n${p.nom}`
    : `Bonjour,\n\nJe vous propose de suivre votre préparation sur Tremplin FLE : vous y verrez vos résultats, vos devoirs et mes commentaires.\n1. Ouvrez ${url}\n2. Choisissez « Élève » et connectez-vous avec cette adresse : ${email}\n3. Acceptez mon invitation dans « Mon professeur ».\n\nÀ bientôt !\n${p.nom}`;
}

/** Message prêt à envoyer : la personne invitée doit créer son compte avec l’adresse invitée. */
function Partage({ email }: { email: string }) {
  const { profil } = useProfil();
  const texte = texteInvitation(profil, email);
  const [etat, setEtat] = useState("");
  return (
    <div className="partage">
      <p className="petit">Prévenez la personne : elle ne verra l’invitation qu’en se connectant avec <b>{email}</b>.</p>
      <textarea readOnly rows={8} value={texte} aria-label="Message d’invitation" onFocus={(e) => e.currentTarget.select()} />
      <div className="actions">
        <button className="btn petit-btn" onClick={async () => setEtat((await copier(texte)) ? "Message copié." : "Copie impossible : sélectionnez le texte et copiez-le.")}>Copier le message</button>
        <a className="btn secondaire petit-btn" href={`https://wa.me/?text=${encodeURIComponent(texte)}`} target="_blank" rel="noreferrer">Envoyer par WhatsApp</a>
        <a className="btn secondaire petit-btn" href={`mailto:${email}?subject=${encodeURIComponent("Invitation sur Tremplin FLE")}&body=${encodeURIComponent(texte)}`}>Envoyer par courriel</a>
        {etat && <span className="petit" role="status">{etat}</span>}
      </div>
    </div>
  );
}

export default function Liens() {
  const { profil } = useProfil();
  const eleve = profil.role === "eleve";
  const { data: liens, recharger } = useDonnee(() => backend.liens(), []);
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; t: string }>();
  const [partage, setPartage] = useState<string>();

  async function inviter(e: React.FormEvent) {
    e.preventDefault();
    try {
      const l = await backend.inviter(email);
      setMsg({ ok: true, t: `Invitation enregistrée pour ${l.emailInvite}.` });
      setPartage(l.emailInvite);
      setEmail("");
      recharger();
    } catch (x) {
      setMsg({ ok: false, t: (x as Error).message });
    }
  }

  const agir = async (f: () => Promise<void>) => {
    try {
      await f();
      setMsg(undefined);
      recharger();
    } catch (x) {
      setMsg({ ok: false, t: (x as Error).message });
    }
  };

  const autre = (l: Lien) => (eleve ? l.professeurNom || l.professeurEmail : l.eleveNom || l.eleveEmail) ?? l.emailInvite;
  const autreId = (l: Lien) => (eleve ? l.professeurId : l.eleveId);
  const actifs = (liens ?? []).filter((l) => l.statut === "actif");
  const recues = (liens ?? []).filter((l) => l.statut === "en_attente" && l.initiateurId !== profil.id);
  const envoyees = (liens ?? []).filter((l) => l.statut === "en_attente" && l.initiateurId === profil.id);

  return (
    <div className="pile">
      <h1>{eleve ? "Mon professeur" : "Invitations et élèves"}</h1>
      <section className="carte">
        <h2>{eleve ? "Inviter mon professeur" : "Inviter un élève"}</h2>
        <p className="petit">
          Le lien se fait par adresse électronique, dans les deux sens. Une fois l’invitation acceptée,
          {eleve ? " votre professeur voit vos résultats, vos productions et votre plan, peut vous donner des devoirs et vous écrire." : " vous voyez les résultats, les productions et le plan de l’élève, vous pouvez lui donner des devoirs et lui écrire."}{" "}
          Chacun paie seulement son propre accès ; le lien est suspendu si l’un des deux accès expire.
        </p>
        <form className="ligne-form" onSubmit={inviter}>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder={eleve ? "adresse de votre professeur" : "adresse de l’élève"} aria-label="Adresse électronique" />
          <button className="btn">Inviter</button>
        </form>
        {msg && <p className={msg.ok ? "succes" : "erreur"} role="status">{msg.t}</p>}
        {partage && <Partage email={partage} />}
      </section>

      {recues.length > 0 && (
        <section className="carte alerte-info">
          <h2>Invitations reçues</h2>
          <ul className="liste">
            {recues.map((l) => (
              <li key={l.id} className="ligne-lien">
                {l.incompatible ? (
                  <span>
                    Une invitation a été envoyée à votre adresse, mais votre compte a le même rôle que la personne qui l’envoie
                    ({eleve ? "élève" : "professeur"}) : elle ne peut pas être acceptée. Prévenez-la.
                  </span>
                ) : (
                  <>
                    <span><b>{autre(l)}</b> souhaite se lier à votre compte <span className="petit">({dateFr(l.creeLe)})</span></span>
                    <span className="actions">
                      <button className="btn petit-btn" onClick={() => agir(() => backend.repondreLien(l.id, true))}>Accepter</button>
                      <button className="btn secondaire petit-btn" onClick={() => agir(() => backend.repondreLien(l.id, false))}>Refuser</button>
                    </span>
                  </>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="carte">
        <h2>{eleve ? "Professeur(s) lié(s)" : "Élèves liés"}</h2>
        {actifs.length === 0 ? <Vide>Aucun lien actif.</Vide> : (
          <ul className="liste">
            {actifs.map((l) => (
              <li key={l.id} className="ligne-lien">
                <span>
                  {!eleve && l.eleveId ? <a href={`#/eleve/${l.eleveId}`}><b>{autre(l)}</b></a> : <b>{autre(l)}</b>}{" "}
                  {l.suspendu ? <Badge ton="attention">suspendu : un accès a expiré</Badge> : <Badge ton="ok">lié</Badge>}
                </span>
                <span className="actions">
                  {autreId(l) && !l.suspendu && <a className="btn secondaire petit-btn" href={`#/messages/${autreId(l)}`}>Messages</a>}
                  <button className="btn-lien" onClick={() => confirm("Supprimer ce lien ? L’autre personne n’aura plus accès à vos échanges.") && agir(() => backend.supprimerLien(l.id))}>Délier</button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {envoyees.length > 0 && (
        <section className="carte">
          <h2>Invitations envoyées</h2>
          <ul className="liste">
            {envoyees.map((l) => (
              <li key={l.id}>
                <div className="ligne-lien">
                  <span>{l.emailInvite} <Badge ton="attention">en attente</Badge> <span className="petit">depuis le {dateFr(l.creeLe)}</span></span>
                  <span className="actions">
                    <button className="btn-lien" onClick={() => setPartage(partage === l.emailInvite ? undefined : l.emailInvite)}>Relancer</button>
                    <button className="btn-lien" onClick={() => agir(() => backend.supprimerLien(l.id))}>Annuler</button>
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
