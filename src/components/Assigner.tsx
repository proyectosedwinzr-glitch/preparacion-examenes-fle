import { useState } from "react";
import { backend } from "../lib/instance";
import { useDonnee } from "../lib/hooks";
import { ACTIVITES } from "../data/activities";

/** Formulaire du professeur : donner une activité précise à un élève lié. */
export default function Assigner({ activiteId, activiteIds, eleveId, consigneParDefaut, fermer }: {
  activiteId?: string; activiteIds?: string[]; eleveId?: string; consigneParDefaut?: string; fermer: () => void;
}) {
  const { data: liens } = useDonnee(() => backend.liens(), []);
  const eleves = (liens ?? []).filter((l) => l.statut === "actif" && l.eleveId);
  const [eleve, setEleve] = useState(eleveId ?? "");
  const [act, setAct] = useState(activiteId ?? "");
  const [consigne, setConsigne] = useState(consigneParDefaut ?? "");
  const [echeance, setEcheance] = useState("");
  const [msg, setMsg] = useState("");

  async function valider(e: React.FormEvent) {
    e.preventDefault();
    try {
      const ids = activiteIds ?? [act];
      for (const id of ids) await backend.assigner({ eleveId: eleve, activiteId: id, consigne: consigne || undefined, echeance: echeance || undefined });
      setMsg(ids.length > 1 ? `${ids.length} devoirs envoyés.` : "Devoir envoyé.");
      setTimeout(fermer, 700);
    } catch (x) {
      setMsg((x as Error).message);
    }
  }

  return (
    <div className="modale-fond" onClick={fermer}>
      <form className="carte modale" onClick={(e) => e.stopPropagation()} onSubmit={valider} aria-label="Assigner un devoir">
        <h2>Assigner un devoir</h2>
        {!eleveId && (
          <label className="champ">Élève
            <select required value={eleve} onChange={(e) => setEleve(e.target.value)}>
              <option value="">Choisir…</option>
              {eleves.map((l) => <option key={l.id} value={l.eleveId}>{l.eleveNom || l.eleveEmail}</option>)}
            </select>
          </label>
        )}
        {eleves.length === 0 && !eleveId && <p className="petit">Aucun élève lié : invitez d’abord un élève.</p>}
        {activiteIds && <p className="petit">{activiteIds.length} activités seront assignées.</p>}
        {!activiteId && !activiteIds && (
          <label className="champ">Activité
            <select required value={act} onChange={(e) => setAct(e.target.value)}>
              <option value="">Choisir…</option>
              {ACTIVITES.map((a) => <option key={a.id} value={a.id}>{a.niveau} · {a.competence} · {a.titre}</option>)}
            </select>
          </label>
        )}
        <label className="champ">Consigne personnelle (facultatif)
          <input value={consigne} onChange={(e) => setConsigne(e.target.value)} placeholder="Concentre-toi sur les connecteurs." />
        </label>
        <label className="champ">À rendre pour le (facultatif)
          <input type="date" value={echeance} onChange={(e) => setEcheance(e.target.value)} />
        </label>
        {msg && <p role="status">{msg}</p>}
        <div className="actions">
          <button type="button" className="btn secondaire" onClick={fermer}>Annuler</button>
          <button className="btn">Envoyer</button>
        </div>
      </form>
    </div>
  );
}
