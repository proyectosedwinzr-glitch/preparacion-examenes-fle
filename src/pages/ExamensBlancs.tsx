import { useState } from "react";
import { EXAMENS_BLANCS, examenBlanc, type ExamenBlanc } from "../data/examensBlancs";
import { activite } from "../data/activities";
import { backend } from "../lib/instance";
import { useDonnee, useProfil } from "../lib/hooks";
import { noterExamen } from "../lib/notation";
import type { Tentative } from "../lib/types";
import { Badge, BadgeComp, T } from "../components/ui";
import Assigner from "../components/Assigner";
import { Chrono } from "./Exercice";

const REGLE = "Chaque épreuve est notée sur 25. Le diplôme est obtenu avec au moins 50/100 et au minimum 5/25 dans chaque épreuve.";
const LIMITES =
  "Simulacres d’entraînement : documents et questionnaires plus courts que l’examen réel. Les notes de production viennent de l’IA ou de votre auto-évaluation, sauf si votre professeur les corrige ; elles sont indicatives.";

export default function ExamensBlancs({ id }: { id?: string }) {
  const { profil } = useProfil();
  const eb = id ? examenBlanc(id) : undefined;
  const { data: ts } = useDonnee(() => (profil.role === "eleve" ? backend.tentatives(profil.id) : Promise.resolve([] as Tentative[])), [profil.id]);
  if (id && !eb) return <p>Examen blanc introuvable. <a href="#/examens-blancs">Retour</a></p>;
  if (eb) return <DetailExamenBlanc eb={eb} tentatives={ts ?? []} />;

  return (
    <div className="pile">
      <h1>Examens blancs</h1>
      <p className="sous-titre">Des sujets complets, dans les conditions de l’examen : épreuves minutées, note sur 100 et règle de réussite officielle.</p>
      <p className="note"><T>{LIMITES}</T></p>
      <div className="grille-cartes">
        {EXAMENS_BLANCS.map((x) => {
          const n = noterExamen(x, ts ?? []);
          return (
            <a key={x.id} href={`#/examens-blancs/${x.id}`} className="carte carte-lien">
              <div className="badges"><Badge>{x.niveau}</Badge> <Badge ton="info">{x.examen.toUpperCase()}</Badge></div>
              <h2><T>{x.titre}</T></h2>
              <p className="petit">Thème : {x.theme} · {x.epreuves.reduce((s, e) => s + e.duree, 0)} min au total</p>
              {profil.role === "eleve" && (
                <p className="petit">{n.total !== null ? <b>Dernier résultat : {n.total}/100</b> : `${n.epreuves.filter((e) => e.note !== null).length}/4 épreuves terminées`}</p>
              )}
            </a>
          );
        })}
      </div>
    </div>
  );
}

function DetailExamenBlanc({ eb, tentatives }: { eb: ExamenBlanc; tentatives: Tentative[] }) {
  const { profil } = useProfil();
  const [assigner, setAssigner] = useState(false);
  const eleve = profil.role === "eleve";
  return (
    <article className="pile">
      <a href="#/examens-blancs" className="retour">← Examens blancs</a>
      <div className="titre-ligne">
        <h1><T>{eb.titre}</T></h1>
        {!eleve && <button className="btn" onClick={() => setAssigner(true)}>Assigner l’examen à un élève</button>}
      </div>
      <p className="note"><T>{REGLE}</T> <T>{LIMITES}</T></p>
      {eleve && <ResultatExamen eb={eb} tentatives={tentatives} />}
      {eb.epreuves.map((ep, i) => (
        <section key={ep.competence} className="carte">
          <div className="titre-ligne">
            <h2><BadgeComp c={ep.competence} /> Épreuve {i + 1} : {ep.nom}</h2>
            <span className="petit">{ep.duree} min</span>
          </div>
          {eleve && <Chrono minutes={ep.duree} label="Temps de l’épreuve" cle={`${eb.id}-${ep.competence}`} />}
          <ol className="liste">
            {ep.activites.map((aid) => {
              const a = activite(aid);
              const faite = tentatives.some((t) => t.activiteId === aid);
              return a ? (
                <li key={aid}>
                  <a href={`#/activite/${aid}?eb=${eb.id}`}><T>{a.titre.replace(/^.*? — /, "")}</T></a>{" "}
                  {eleve && (faite ? <Badge ton="ok">fait</Badge> : <Badge>à faire</Badge>)}
                </li>
              ) : null;
            })}
          </ol>
        </section>
      ))}
      {assigner && (
        <Assigner
          activiteIds={eb.epreuves.flatMap((e) => e.activites)}
          consigneParDefaut={`${eb.titre} : faites les épreuves dans l’ordre, en respectant les durées.`}
          fermer={() => setAssigner(false)}
        />
      )}
    </article>
  );
}

/** Tableau de notes d’un examen blanc ; utilisé aussi dans la vue « Progrès » partagée avec le professeur. */
export function ResultatExamen({ eb, tentatives }: { eb: ExamenBlanc; tentatives: Tentative[] }) {
  const n = noterExamen(eb, tentatives);
  return (
    <section className="carte resultat-examen">
      <div className="titre-ligne">
        <h2><T>{eb.titre}</T></h2>
        {n.total !== null ? (
          <div className="note-ia"><b>{n.total}</b>/100 {n.reussi ? <Badge ton="ok">Réussi</Badge> : <Badge ton="attention">Non réussi</Badge>}</div>
        ) : (
          <span className="petit">Examen en cours</span>
        )}
      </div>
      <table className="tableau">
        <thead><tr><th>Épreuve</th><th>Note /25</th><th>Statut</th></tr></thead>
        <tbody>
          {n.epreuves.map((e) => (
            <tr key={e.epreuve.competence}>
              <td><BadgeComp c={e.epreuve.competence} /> {e.epreuve.nom}</td>
              <td className={e.note !== null && e.note < 5 ? "note-eliminatoire" : ""}>{e.note ?? "—"}</td>
              <td className="petit">
                {e.note === null ? `${e.faites}/${e.epreuve.activites.length} ${e.epreuve.activites.length > 1 ? "parties faites" : "partie faite"}` : e.note < 5 ? "Note éliminatoire (moins de 5)" : "Terminée"}
                {e.corrigeeParProf && " · corrigée par le professeur"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
