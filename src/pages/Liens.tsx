import { useState } from "react";
import { backend } from "../lib/instance";
import { useDonnee, useProfil } from "../lib/hooks";
import type { Lien } from "../lib/types";
import { dateFr } from "../lib/util";
import { Badge, Vide } from "../components/ui";

export default function Liens() {
  const { profil } = useProfil();
  const eleve = profil.role === "eleve";
  const { data: liens, recharger } = useDonnee(() => backend.liens(), []);
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; t: string }>();

  async function inviter(e: React.FormEvent) {
    e.preventDefault();
    try {
      await backend.inviter(email);
      setMsg({ ok: true, t: `Invitation enregistrée pour ${email}. ${backend.mode === "demo" ? "En démonstration, connectez-vous avec cette adresse pour l’accepter." : "La personne la verra dès sa connexion ; prévenez-la de créer son compte avec cette adresse."}` });
      setEmail("");
      recharger();
    } catch (x) {
      setMsg({ ok: false, t: (x as Error).message });
    }
  }

  const agir = async (f: () => Promise<void>) => {
    try { await f(); setMsg(undefined); recharger(); } catch (x) { setMsg({ ok: false, t: (x as Error).message }); }
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
          Le lien se fait par adresse électronique, dans les deux sens. Une fois l’invitation acceptée, {eleve ? "votre professeur voit" : "vous voyez"} les résultats, les productions et le plan d’amélioration,
          {eleve ? " peut vous donner des devoirs et vous écrire." : " pouvez donner des devoirs et écrire à l’élève."} Les deux comptes doivent avoir un accès actif.
        </p>
        <form className="ligne-form" onSubmit={inviter}>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder={eleve ? "adresse de votre professeur" : "adresse de l’élève"} aria-label="Adresse électronique" />
          <button className="btn">Inviter</button>
        </form>
        {msg && <p className={msg.ok ? "succes" : "erreur"} role="status">{msg.t}</p>}
      </section>

      {recues.length > 0 && (
        <section className="carte alerte-info">
          <h2>Invitations reçues</h2>
          <ul className="liste">
            {recues.map((l) => (
              <li key={l.id} className="ligne-lien">
                <span><b>{autre(l)}</b> souhaite se lier à votre compte <span className="petit">({dateFr(l.creeLe)})</span></span>
                <span className="actions">
                  <button className="btn petit-btn" onClick={() => agir(() => backend.repondreLien(l.id, true))}>Accepter</button>
                  <button className="btn secondaire petit-btn" onClick={() => agir(() => backend.repondreLien(l.id, false))}>Refuser</button>
                </span>
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
                <span>{!eleve && l.eleveId ? <a href={`#/eleve/${l.eleveId}`}><b>{autre(l)}</b></a> : <b>{autre(l)}</b>} <Badge ton="ok">lié</Badge></span>
                <span className="actions">
                  {autreId(l) && <a className="btn secondaire petit-btn" href={`#/messages/${autreId(l)}`}>Messages</a>}
                  <button className="btn-lien" onClick={() => confirm("Supprimer ce lien ? L’autre personne n’aura plus accès.") && agir(() => backend.supprimerLien(l.id))}>Délier</button>
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
              <li key={l.id} className="ligne-lien">
                <span>{l.emailInvite} <Badge ton="attention">en attente</Badge></span>
                <button className="btn-lien" onClick={() => agir(() => backend.supprimerLien(l.id))}>Annuler</button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
