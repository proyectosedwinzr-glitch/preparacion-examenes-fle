import { AVERTISSEMENT_EXAMENS, EXAMENS, examen } from "../data/exams";
import { ACTIVITES } from "../data/activities";
import { BadgeComp, Badge, T } from "../components/ui";

export default function Examens({ id }: { id?: string }) {
  if (id) return <DetailExamen id={id} />;
  return (
    <div className="pile">
      <h1>Les examens de français</h1>
      <p className="sous-titre">Structure, compétences évaluées, exemples et conseils pour chaque certification.</p>
      <div className="grille-cartes">
        {EXAMENS.map((e) => (
          <a key={e.id} href={`#/examens/${e.id}`} className="carte carte-lien">
            <h2>{e.nom}</h2>
            <p className="petit">{e.nomComplet}</p>
            <div className="badges">{e.niveaux.map((n) => <Badge key={n}>{n}</Badge>)}</div>
            <p className="petit"><T>{e.organisme}</T></p>
          </a>
        ))}
      </div>
      <p className="note"><T>{AVERTISSEMENT_EXAMENS}</T></p>
    </div>
  );
}

function DetailExamen({ id }: { id: string }) {
  const e = examen(id);
  if (!e) return <p>Examen introuvable. <a href="#/examens">Retour</a></p>;
  const activites = ACTIVITES.filter((a) => a.examens.includes(e.id));
  return (
    <article className="pile">
      <a href="#/examens" className="retour">← Tous les examens</a>
      <header>
        <h1>{e.nom} <span className="leger">— {e.nomComplet}</span></h1>
        <p><T>{e.organisme}</T> · <a href={e.lienOfficiel} target="_blank" rel="noreferrer">site officiel ↗</a></p>
        <div className="badges">{e.niveaux.map((n) => <Badge key={n}>{n}</Badge>)}</div>
      </header>

      <div className="grille-2">
        <section className="carte">
          <h2>Pour qui, pour quoi ?</h2>
          <p><T>{e.public}</T></p>
          <ul>{e.usages.map((u) => <li key={u}><T>{u}</T></li>)}</ul>
        </section>
        <section className="carte">
          <h2>Résultats et validité</h2>
          <p><T>{e.resultat}</T></p>
          <p><b>Validité : </b><T>{e.validite}</T></p>
        </section>
      </div>

      <section className="carte">
        <h2>Structure et compétences évaluées</h2>
        <div className="epreuves">
          {e.epreuves.map((ep) => (
            <div key={ep.nom} className="epreuve">
              <div className="epreuve-tete"><BadgeComp c={ep.competence} /> <b>{ep.nom}</b></div>
              <p className="petit"><b>Durée : </b><T>{ep.duree}</T></p>
              <p><T>{ep.format}</T></p>
              <p className="petit"><b>Ce qui est évalué :</b></p>
              <ul className="petit">{ep.evalue.map((x) => <li key={x}><T>{x}</T></li>)}</ul>
            </div>
          ))}
        </div>
      </section>

      <section className="carte">
        <h2>Exemple de tâche — {e.exemple.epreuve}</h2>
        <blockquote><T>{e.exemple.consigne}</T></blockquote>
        <p><b>Ce que le correcteur attend : </b><T>{e.exemple.attendu}</T></p>
      </section>

      <div className="grille-2">
        <section className="carte">
          <h2>Conseils de correcteur</h2>
          <ul>{e.conseils.map((c) => <li key={c}><T>{c}</T></li>)}</ul>
        </section>
        <section className="carte encadre-piege">
          <h2>Pièges fréquents</h2>
          <ul>{e.pieges.map((c) => <li key={c}><T>{c}</T></li>)}</ul>
        </section>
      </div>

      <section className="carte">
        <h2>S’entraîner pour le {e.nom}</h2>
        <ul className="liste">
          {activites.map((a) => (
            <li key={a.id}><a href={`#/activite/${a.id}`}>{a.titre}</a> <BadgeComp c={a.competence} /> <Badge>{a.niveau}</Badge></li>
          ))}
        </ul>
      </section>
      <p className="note"><T>{AVERTISSEMENT_EXAMENS}</T></p>
    </article>
  );
}
