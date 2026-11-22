import { useState } from "react";
import { THEMES, themeFiche, idQuizLexique, type FicheThematique } from "../data/themes";
import { NIVEAUX } from "../lib/types";
import { useProfil } from "../lib/hooks";
import { Badge, T } from "../components/ui";
import { BoutonEcoute } from "../components/Lecteur";
import Assigner from "../components/Assigner";

export default function Revisions({ id }: { id?: string }) {
  const { profil } = useProfil();
  const [niveau, setNiveau] = useState<string>(profil.niveauVise ?? "");
  const t = id ? themeFiche(id) : undefined;
  if (id && !t) return <p>Révision introuvable. <a href="#/revisions">Retour</a></p>;
  if (t) return <Detail t={t} />;
  const liste = THEMES.filter((x) => !niveau || x.niveau === niveau);
  return (
    <div className="pile">
      <h1>Révisions thématiques</h1>
      <p className="sous-titre">Le lexique des thèmes d’examen, niveau par niveau : mots et expressions, texte modèle à écouter, cartes de mémorisation et quiz.</p>
      <div className="onglets" role="group" aria-label="Filtrer par niveau">
        {["", ...NIVEAUX].map((n) => (
          <button key={n} className={`onglet ${niveau === n ? "actif" : ""}`} aria-pressed={niveau === n} onClick={() => setNiveau(n)}>{n || "Tous"}</button>
        ))}
      </div>
      <div className="grille-cartes">
        {liste.map((x) => (
          <a key={x.id} className="mini-carte" href={`#/revisions/${x.id}`}>
            <div className="badges"><Badge>{x.niveau}</Badge></div>
            <b>{x.theme}</b>
            <span className="petit">{x.resume}</span>
            <span className="petit">{x.lexique.length} mots · {x.expressions.length} expressions</span>
          </a>
        ))}
      </div>
    </div>
  );
}

function Detail({ t }: { t: FicheThematique }) {
  const { profil } = useProfil();
  const [mode, setMode] = useState<"liste" | "cartes">("liste");
  const [assigner, setAssigner] = useState(false);
  return (
    <article className="pile">
      <a href="#/revisions" className="retour">← Révisions</a>
      <header>
        <div className="badges"><Badge>{t.niveau}</Badge></div>
        <h1>{t.theme}</h1>
        <p className="sous-titre"><T>{t.resume}</T></p>
      </header>
      <div className="actions">
        <button className={`btn ${mode === "liste" ? "" : "secondaire"}`} aria-pressed={mode === "liste"} onClick={() => setMode("liste")}>Lexique</button>
        <button className={`btn ${mode === "cartes" ? "" : "secondaire"}`} aria-pressed={mode === "cartes"} onClick={() => setMode("cartes")}>Cartes de mémorisation</button>
        <a className="btn secondaire" href={`#/activite/${idQuizLexique(t.id)}`}>Faire le quiz</a>
        {profil.role === "professeur" && <button className="btn secondaire" onClick={() => setAssigner(true)}>Assigner le quiz</button>}
      </div>
      {mode === "cartes" ? (
        <Cartes t={t} />
      ) : (
        <>
          <section className="carte">
            <h2>Lexique</h2>
            <div className="tableau-defile">
              <table className="tableau">
                <thead><tr><th>Mot ou expression</th><th>Sens</th><th>Exemple</th></tr></thead>
                <tbody>
                  {t.lexique.map((e) => (
                    <tr key={e.mot}>
                      <td className="mot"><b>{e.mot}</b> <BoutonEcoute texte={`${e.mot}. ${e.exemple}`} /></td>
                      <td><T>{e.indice}</T></td>
                      <td><T>{e.exemple}</T></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
          <div className="grille-2">
            <section className="carte"><h2>Expressions utiles</h2><ul>{t.expressions.map((x) => <li key={x}><T>{x}</T></li>)}</ul></section>
            <section className="carte"><h2>À l’oral</h2><ul>{t.aLoral.map((x) => <li key={x}><T>{x}</T></li>)}</ul></section>
          </div>
          <section className="carte document">
            <div className="titre-ligne"><h2>Texte modèle</h2><BoutonEcoute texte={t.modele} label="Écouter le texte" /></div>
            <p><T>{t.modele}</T></p>
          </section>
        </>
      )}
      {assigner && <Assigner activiteId={idQuizLexique(t.id)} fermer={() => setAssigner(false)} />}
    </article>
  );
}

/** Cartes de mémorisation : définition au recto, mot et exemple au verso. Les mots acquis sont gardés sur l’appareil. */
function Cartes({ t }: { t: FicheThematique }) {
  const cle = `tremplin-cartes-${t.id}`;
  const lireSus = (): string[] => {
    try {
      return JSON.parse(localStorage.getItem(cle) ?? "[]");
    } catch {
      return [];
    }
  };
  const [sus, setSus] = useState<string[]>(lireSus);
  const [i, setI] = useState(0);
  const [retournee, setRetournee] = useState(false);
  const pile = t.lexique.filter((e) => !sus.includes(e.mot));
  const e = pile.length ? pile[i % pile.length] : undefined;
  const enregistrer = (n: string[]) => {
    setSus(n);
    try {
      localStorage.setItem(cle, JSON.stringify(n));
    } catch {
      /* stockage indisponible */
    }
  };
  const noter = (su: boolean) => {
    if (!e) return;
    setRetournee(false);
    if (su) enregistrer([...sus, e.mot]);
    else setI((x) => x + 1);
  };

  if (!e)
    return (
      <section className="carte cartes-fin">
        <h2>Bravo !</h2>
        <p>Vous connaissez les {t.lexique.length} mots de ce thème.</p>
        <div className="actions">
          <a className="btn" href={`#/activite/${idQuizLexique(t.id)}`}>Vérifier avec le quiz</a>
          <button className="btn secondaire" onClick={() => enregistrer([])}>Recommencer les cartes</button>
        </div>
      </section>
    );
  return (
    <section className="carte cartes">
      <p className="petit" aria-live="polite">{sus.length} / {t.lexique.length} mots acquis</p>
      <button className={`carte-memoire ${retournee ? "retournee" : ""}`} onClick={() => setRetournee(!retournee)} aria-label={retournee ? "Revoir la définition" : "Retourner la carte pour voir la réponse"}>
        {!retournee ? (
          <span className="carte-recto"><span className="petit">Quel est le mot ?</span><span><T>{e.indice}</T></span></span>
        ) : (
          <span className="carte-verso"><b>{e.mot}</b><span><T>{e.exemple}</T></span></span>
        )}
      </button>
      {retournee ? (
        <div className="actions">
          <button className="btn" onClick={() => noter(true)}>Je savais</button>
          <button className="btn secondaire" onClick={() => noter(false)}>À revoir</button>
        </div>
      ) : (
        <p className="petit">Cherchez le mot, puis touchez la carte pour vérifier.</p>
      )}
    </section>
  );
}
