import { COMPETENCES, type PlanIA } from "../lib/types";
import { resoudreRef } from "../lib/plan";
import { BadgeComp, Paragraphes, T } from "./ui";

/** Plan d’amélioration structuré, chaque tâche renvoyant au contenu correspondant. */
export default function PlanVue({ plan }: { plan: PlanIA }) {
  const c = plan.contenu;
  if (!c) return <Paragraphes texte={plan.texte} />;
  return (
    <div className="plan">
      <p className="plan-diagnostic"><T>{c.diagnostic}</T></p>
      {c.priorites.length > 0 && (
        <div className="plan-priorites">
          {c.priorites.map((p) => (
            <div key={p.competence} className="plan-priorite">
              <div><BadgeComp c={p.competence} /> <b>{COMPETENCES[p.competence]}</b></div>
              <p className="petit"><T>{p.constat}</T></p>
              <p><T>{p.objectif}</T></p>
            </div>
          ))}
        </div>
      )}
      {c.etapes.map((e) => (
        <section key={e.titre} className="plan-etape">
          <h3><T>{e.titre}</T></h3>
          <ul className="plan-taches">
            {e.taches.map((t, i) => {
              const r = resoudreRef(t.ref);
              return (
                <li key={i}>
                  <T>{t.texte}</T>
                  {r && <> <a href={r.href} className="lien-tache">{r.label} →</a></>}
                </li>
              );
            })}
          </ul>
        </section>
      ))}
      {c.indicateurs.length > 0 && (
        <>
          <h3>Indicateurs de progrès</h3>
          <ul>{c.indicateurs.map((i) => <li key={i}><T>{i}</T></li>)}</ul>
        </>
      )}
    </div>
  );
}
