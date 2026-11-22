import { useMemo, useState } from "react";
import { TEST_NIVEAU, estimerNiveau, type ResultatTest } from "../data/testNiveau";
import { backend } from "../lib/instance";
import { useProfil } from "../lib/hooks";
import { NIVEAUX } from "../lib/types";
import { melanger, TEST_NIVEAU_ID } from "../lib/util";
import { Badge, Jauge, T } from "../components/ui";

const DESCRIPTION: Record<string, string> = {
  A1: "Vous comprenez et utilisez des expressions familières pour vous présenter et répondre à des besoins simples.",
  A2: "Vous communiquez dans des situations simples et habituelles et décrivez votre environnement.",
  B1: "Vous vous débrouillez dans la plupart des situations du quotidien et donnez votre avis sur des sujets familiers.",
  B2: "Vous comprenez des textes complexes et argumentez de façon claire et détaillée.",
  C1: "Vous vous exprimez avec aisance et précision, y compris sur des sujets abstraits ou professionnels.",
  C2: "Vous comprenez pratiquement tout et nuancez finement votre expression.",
};

export default function TestNiveau() {
  const { profil, setProfil } = useProfil();
  const ordres = useMemo(() => TEST_NIVEAU.map((it, i) => melanger(it.options.map((_, k) => k), `test-${i}`)), []);
  const [i, setI] = useState(-1);
  const [rep, setRep] = useState<(number | undefined)[]>([]);
  const [choix, setChoix] = useState<number>();
  const [res, setRes] = useState<ResultatTest>();
  const [msg, setMsg] = useState("");
  const eleve = profil.role === "eleve";

  async function suivant(valeur: number | undefined) {
    const r = [...rep];
    r[i] = valeur;
    setRep(r);
    setChoix(undefined);
    if (i < TEST_NIVEAU.length - 1) return setI(i + 1);
    const resultat = estimerNiveau(r);
    setRes(resultat);
    if (!eleve) return;
    try {
      await backend.enregistrerTentative({
        activiteId: TEST_NIVEAU_ID, titre: "Test de niveau", niveau: resultat.niveau, competence: "LS", examens: [],
        score: resultat.total, max: TEST_NIVEAU.length,
        reponses: Object.fromEntries(NIVEAUX.map((n) => [n, `${resultat.parNiveau[n]}/4`])),
      });
    } catch (e) {
      setMsg((e as Error).message);
    }
  }

  if (res)
    return (
      <div className="pile">
        <h1>Votre niveau estimé : {res.niveau}</h1>
        <section className="carte etape">
          <p className="sur-titre">Résultat : {res.total} bonnes réponses sur {TEST_NIVEAU.length}</p>
          <p>{DESCRIPTION[res.niveau]}</p>
          {res.debutant && <p className="petit">Les bases du niveau A1 sont encore à consolider : commencez par les fiches A1.</p>}
          {msg && <p className="erreur">{msg}</p>}
          <div className="actions">
            {eleve && profil.niveauVise !== res.niveau && (
              <button className="btn" onClick={async () => setProfil(await backend.majProfil({ niveauVise: res.niveau }))}>Travailler au niveau {res.niveau}</button>
            )}
            {eleve && profil.niveauVise === res.niveau && <Badge ton="ok">Niveau de travail : {res.niveau}</Badge>}
            <a className="btn secondaire" href={`#/niveaux/${res.niveau}`}>Fiches {res.niveau}</a>
            <a className="btn secondaire" href="#/">Retour à l’accueil</a>
          </div>
        </section>
        <section className="carte">
          <h2>Détail par niveau</h2>
          <ul className="liste-stats">
            {NIVEAUX.map((n) => (
              <li key={n}><span className="stat-nom"><Badge>{n}</Badge></span><Jauge valeur={res.parNiveau[n] / 4} label={n} /><span>{res.parNiveau[n]}/4</span></li>
            ))}
          </ul>
          <p className="petit">Ce test rapide donne une estimation, pas un résultat officiel. Seul un examen certifie un niveau.</p>
        </section>
        <details className="carte">
          <summary>Revoir les questions et les corrigés</summary>
          <ol>
            {TEST_NIVEAU.map((it, k) => (
              <li key={k} className="corrige-test">
                <p><T>{it.q}</T></p>
                <p className={rep[k] === it.bonne ? "texte-ok" : "texte-alerte"}>
                  {rep[k] === it.bonne ? "✓" : "✗"} Réponse : <b>{it.options[it.bonne]}</b> — <T>{it.explication}</T>
                </p>
              </li>
            ))}
          </ol>
        </details>
      </div>
    );

  if (i < 0)
    return (
      <div className="pile">
        <h1>Test de niveau</h1>
        <section className="carte etape">
          <p>{TEST_NIVEAU.length} questions de difficulté croissante, du niveau A1 au niveau C2, pour estimer votre niveau en grammaire, en vocabulaire et en compréhension. Comptez environ 15 minutes.</p>
          <p className="petit">Répondez sans dictionnaire. Si vous ne savez pas, choisissez « Je ne sais pas » : deviner fausserait le résultat.</p>
          <button className="btn" onClick={() => setI(0)}>Commencer le test</button>
        </section>
      </div>
    );

  const it = TEST_NIVEAU[i];
  return (
    <div className="pile test-niveau">
      <h1>Test de niveau</h1>
      <div className="test-progression">
        <span className="petit">Question {i + 1} sur {TEST_NIVEAU.length}</span>
        <Jauge valeur={i / TEST_NIVEAU.length} label="Progression du test" />
      </div>
      <section className="carte question">
        {it.support && <blockquote><T>{it.support}</T></blockquote>}
        <p className="q"><T>{it.q}</T></p>
        <div className="options" role="radiogroup" aria-label={`Question ${i + 1}`}>
          {ordres[i].map((k) => (
            <label key={k} className={`option ${choix === k ? "choisie" : ""}`}>
              <input type="radio" name={`test-${i}`} checked={choix === k} onChange={() => setChoix(k)} />
              <T>{it.options[k]}</T>
            </label>
          ))}
        </div>
      </section>
      <div className="actions">
        <button className="btn" disabled={choix === undefined} onClick={() => suivant(choix)}>{i < TEST_NIVEAU.length - 1 ? "Question suivante" : "Voir mon résultat"}</button>
        <button className="btn secondaire" onClick={() => suivant(undefined)}>Je ne sais pas</button>
      </div>
    </div>
  );
}
