import { NIVEAUX_CECRL, niveau as trouverNiveau, toutesFiches, type FichePedagogique } from "../data/levels";
import { activite } from "../data/activities";
import { COMPETENCES } from "../lib/types";
import { Badge, BadgeComp, T } from "../components/ui";

export default function Niveaux({ niveau, fiche }: { niveau?: string; fiche?: string }) {
  if (fiche) {
    const f = toutesFiches().find((x) => x.id === fiche);
    return f ? <Fiche f={f} /> : <p>Fiche introuvable.</p>;
  }
  const n = trouverNiveau(niveau ?? "") ?? null;
  return (
    <div className="pile">
      <h1>Les niveaux du CECRL</h1>
      <nav className="onglets" aria-label="Niveaux">
        {NIVEAUX_CECRL.map((x) => (
          <a key={x.niveau} href={`#/niveaux/${x.niveau}`} aria-current={n?.niveau === x.niveau ? "page" : undefined}>
            <b>{x.niveau}</b> <span>{x.nom}</span>
          </a>
        ))}
      </nav>
      {!n ? (
        <div className="grille-cartes">
          {NIVEAUX_CECRL.map((x) => (
            <a key={x.niveau} className="carte carte-lien" href={`#/niveaux/${x.niveau}`}>
              <h2>{x.niveau} · {x.nom}</h2>
              <p className="petit"><T>{x.resume}</T></p>
            </a>
          ))}
        </div>
      ) : (
        <>
          <section className="carte">
            <h2>{n.niveau} · {n.nom}</h2>
            <p><T>{n.resume}</T></p>
            <p className="petit">Volume d’apprentissage guidé souvent cité : {n.heures} (cumulés depuis le début, ordre de grandeur).</p>
            <div className="badges">{n.examens.map((e) => <a key={e.label} href={`#/examens/${e.id}`}><Badge ton="info">{e.label}</Badge></a>)}</div>
          </section>
          <section className="carte">
            <h2>Ce que vous devez savoir faire</h2>
            <div className="grille-4">
              {(Object.keys(n.savoirFaire) as (keyof typeof n.savoirFaire)[]).map((c) => (
                <div key={c}>
                  <h3><BadgeComp c={c} /> {COMPETENCES[c]}</h3>
                  <ul className="petit">{n.savoirFaire[c].map((s) => <li key={s}><T>{s}</T></li>)}</ul>
                </div>
              ))}
            </div>
          </section>
          <div className="grille-3">
            <section className="carte"><h2>Thèmes</h2><ul>{n.themes.map((t) => <li key={t}>{t}</li>)}</ul></section>
            <section className="carte"><h2>Grammaire</h2><ul>{n.grammaire.map((t) => <li key={t}><T>{t}</T></li>)}</ul></section>
            <section className="carte"><h2>Lexique</h2><ul>{n.lexique.map((t) => <li key={t}>{t}</li>)}</ul></section>
          </div>
          <section className="carte">
            <h2>Fiches pédagogiques {n.niveau}</h2>
            <div className="grille-cartes">
              {n.fiches.map((f) => (
                <a key={f.id} className="mini-carte" href={`#/fiche/${f.id}`}>
                  <div><BadgeComp c={f.competence} /></div>
                  <b><T>{f.titre}</T></b>
                  <span className="petit"><T>{f.objectif}</T></span>
                </a>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function Fiche({ f }: { f: FichePedagogique }) {
  return (
    <article className="pile fiche">
      <a href={`#/niveaux/${f.niveau}`} className="retour">← Niveau {f.niveau}</a>
      <header>
        <div className="badges"><Badge>{f.niveau}</Badge> <BadgeComp c={f.competence} /></div>
        <h1><T>{f.titre}</T></h1>
        <p className="objectif-fiche"><b>Objectif : </b><T>{f.objectif}</T></p>
      </header>
      <section className="carte">
        <h2>Explication</h2>
        {f.explication.map((p) => <p key={p}><T>{p}</T></p>)}
        {f.tableau && (
          <div className="tableau-defile">
            <table className="tableau">
              <thead><tr>{f.tableau[0].map((c, i) => <th key={i}>{c}</th>)}</tr></thead>
              <tbody>{f.tableau.slice(1).map((l, i) => <tr key={i}>{l.map((c, j) => <td key={j}>{c}</td>)}</tr>)}</tbody>
            </table>
          </div>
        )}
      </section>
      <section className="carte">
        <h2>Exemples</h2>
        {f.exemples.map((e) => <blockquote key={e}><T>{e}</T></blockquote>)}
      </section>
      <div className="grille-2">
        <section className="carte encadre-retenir"><h2>À retenir</h2><ul>{f.aRetenir.map((x) => <li key={x}><T>{x}</T></li>)}</ul></section>
        <section className="carte encadre-piege"><h2>Piège fréquent</h2><p><T>{f.piege}</T></p></section>
      </div>
      <section className="carte">
        <h2>S’entraîner</h2>
        <ul className="liste">
          {f.activites.map((id) => {
            const a = activite(id);
            return a && <li key={id}><a href={`#/activite/${id}`}>{a.titre}</a> <BadgeComp c={a.competence} /> <span className="petit">{a.duree} min</span></li>;
          })}
        </ul>
      </section>
    </article>
  );
}
