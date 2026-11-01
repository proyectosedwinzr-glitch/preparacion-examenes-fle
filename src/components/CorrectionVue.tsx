import type { CorrectionIA } from "../lib/types";
import { T } from "./ui";

export default function CorrectionVue({ c }: { c: CorrectionIA }) {
  return (
    <section className="carte correction">
      <div className="titre-ligne">
        <h2>Correction</h2>
        <div className="note-ia"><b>{c.note}</b>/20 <span className="petit">· niveau estimé : {c.niveauEstime}</span></div>
      </div>
      <p className="petit">Note indicative produite par l’IA. Seul l’examen officiel délivre une note certifiée.</p>
      <table className="tableau">
        <thead><tr><th>Critère</th><th>Points</th><th>Commentaire</th></tr></thead>
        <tbody>
          {c.criteres.map((k) => (
            <tr key={k.nom}><td><T>{k.nom}</T></td><td>{k.points}/{k.max}</td><td><T>{k.commentaire}</T></td></tr>
          ))}
        </tbody>
      </table>
      {c.erreurs.length > 0 && (
        <>
          <h3>Erreurs expliquées</h3>
          <ul className="erreurs">
            {c.erreurs.map((e, i) => (
              <li key={i}>
                <s>{e.extrait}</s> → <b>{e.correction}</b>
                <div className="petit"><T>{e.explication}</T></div>
              </li>
            ))}
          </ul>
        </>
      )}
      <div className="grille-2">
        {c.pointsForts.length > 0 && (
          <div className="encadre-retenir"><h3>Points forts</h3><ul>{c.pointsForts.map((x) => <li key={x}><T>{x}</T></li>)}</ul></div>
        )}
        <div><h3>Pour progresser</h3><ul>{c.conseils.map((x) => <li key={x}><T>{x}</T></li>)}</ul></div>
      </div>
    </section>
  );
}
