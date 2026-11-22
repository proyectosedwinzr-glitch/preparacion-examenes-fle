import { useState } from "react";
import { backend } from "../lib/instance";
import { useDonnee, useProfil } from "../lib/hooks";
import { planAmelioration } from "../lib/ai";
import { COMPETENCES, NIVEAUX, type Tentative } from "../lib/types";
import { dateFr, pct, statistiques, taux, TEST_NIVEAU_ID } from "../lib/util";
import { Badge, BadgeComp, Jauge, Vide } from "../components/ui";
import CorrectionVue from "../components/CorrectionVue";
import PlanVue from "../components/PlanVue";
import { EXAMENS } from "../data/exams";
import { EXAMENS_BLANCS } from "../data/examensBlancs";
import { ResultatExamen } from "./ExamensBlancs";

/** Production (écrite ou orale) que le professeur n’a pas encore commentée ni notée. */
const aCorriger = (t: Tentative) => (t.competence === "PE" || t.competence === "PO") && t.commentaireProf == null && t.noteProf == null;

/**
 * Vue partagée : l’élève et son professeur voient exactement les mêmes données.
 * Le professeur peut en plus commenter et noter chaque tentative.
 */
export default function Progres({ eleveId, nomEleve }: { eleveId: string; nomEleve?: string }) {
  const { profil } = useProfil();
  const estEleve = profil.id === eleveId;
  const prof = profil.role === "professeur";
  const { data: ts } = useDonnee(() => backend.tentatives(eleveId), [eleveId]);
  const { data: plan } = useDonnee(() => backend.plan(eleveId), [eleveId]);
  const [genere, setGenere] = useState(false);
  const [msg, setMsg] = useState("");
  const [ouverte, setOuverte] = useState<string>();
  const [filtre, setFiltre] = useState<"tout" | "corriger">("tout");

  const toutes = ts ?? [];
  const test = toutes.find((t) => t.activiteId === TEST_NIVEAU_ID);
  const liste = toutes.filter((t) => t.activiteId !== TEST_NIVEAU_ID);
  const stats = statistiques(liste);
  const parNiveau = NIVEAUX.map((n) => {
    const l = liste.filter((t) => t.niveau === n);
    return { n, nb: l.length, moy: l.length ? l.reduce((s, t) => s + taux(t), 0) / l.length : 0 };
  }).filter((x) => x.nb > 0);
  const nbACorriger = liste.filter(aCorriger).length;
  // La tentative ouverte reste affichée après sa correction, pour que le professeur voie la confirmation.
  const historique = filtre === "corriger" ? liste.filter((t) => aCorriger(t) || t.id === ouverte) : toutes;

  async function generer() {
    setGenere(true);
    setMsg("");
    try {
      const r = await planAmelioration(toutes, profil, EXAMENS.find((e) => e.id === profil.examenVise)?.nom);
      await backend.enregistrerPlan(r.texte, r.plan);
      if (r.avertissement) setMsg(r.avertissement);
    } catch (e) {
      setMsg((e as Error).message);
    } finally {
      setGenere(false);
    }
  }

  return (
    <div className="pile">
      <h1>{estEleve ? "Mes progrès" : `Progrès de ${nomEleve ?? "l’élève"}`}</h1>
      {test && (
        <section className="carte">
          <div className="titre-ligne">
            <h2>Test de niveau : {test.niveau}</h2>
            {estEleve && <a href="#/test-niveau" className="lien-fleche">Refaire le test →</a>}
          </div>
          <p className="petit">Passé le {dateFr(test.faiteLe)} · {test.score}/{test.max} bonnes réponses{test.reponses ? ` · ${Object.entries(test.reponses).map(([k, v]) => `${k} ${v}`).join(", ")}` : ""}</p>
        </section>
      )}
      {liste.length === 0 ? (
        <Vide>Aucune activité réalisée pour l’instant.{estEleve && <> <a href="#/activites">Choisir une activité</a></>}</Vide>
      ) : (
        <>
          <div className="grille-2">
            <section className="carte">
              <h2>Par compétence</h2>
              <ul className="liste-stats">
                {stats.map((s) => (
                  <li key={s.competence}>
                    <span className="stat-nom"><BadgeComp c={s.competence} /> {COMPETENCES[s.competence]}</span>
                    <Jauge valeur={s.moyenne} label={COMPETENCES[s.competence]} />
                    <span>{pct(s.moyenne)}</span>
                    <span className="petit">{s.nb} act.{Math.abs(s.tendance) >= 0.01 && <> · {s.tendance > 0 ? "↗" : "↘"} {Math.abs(Math.round(s.tendance * 100))} pts</>}</span>
                  </li>
                ))}
              </ul>
            </section>
            <section className="carte">
              <h2>Par niveau</h2>
              <ul className="liste-stats">
                {parNiveau.map((x) => (
                  <li key={x.n}><span className="stat-nom"><Badge>{x.n}</Badge></span><Jauge valeur={x.moy} label={x.n} /><span>{pct(x.moy)}</span><span className="petit">{x.nb} act.</span></li>
                ))}
              </ul>
            </section>
          </div>
          <Courbe ts={liste} />
        </>
      )}

      {EXAMENS_BLANCS.filter((eb) => liste.some((t) => eb.epreuves.some((e) => e.activites.includes(t.activiteId)))).map((eb) => (
        <ResultatExamen key={eb.id} eb={eb} tentatives={liste} />
      ))}

      <section className="carte">
        <div className="titre-ligne">
          <h2>Plan d’amélioration</h2>
          {estEleve && (
            <button className="btn" onClick={generer} disabled={genere}>
              {genere ? "Préparation…" : plan ? "Actualiser mon plan" : "Créer mon plan"}
            </button>
          )}
        </div>
        {msg && <p className="note">{msg}</p>}
        {plan ? (
          <>
            <p className="petit">
              Créé le {dateFr(plan.creeLe)}{plan.contenu && <> · {plan.contenu.source === "ia" ? "rédigé par l’IA" : "calculé par l’application à partir des résultats"}</>}
            </p>
            <PlanVue plan={plan} />
          </>
        ) : (
          <Vide>Pas encore de plan. {estEleve ? "Il se construit à partir de vos résultats : créez-le maintenant, puis actualisez-le chaque semaine." : "L’élève peut le créer depuis ses progrès."}</Vide>
        )}
      </section>

      <section className="carte">
        <div className="titre-ligne">
          <h2>Historique</h2>
          {prof && (
            <div className="filtres-boutons" role="group" aria-label="Filtrer l’historique">
              <button className={`btn petit-btn ${filtre === "tout" ? "" : "secondaire"}`} aria-pressed={filtre === "tout"} onClick={() => setFiltre("tout")}>Tout</button>
              <button className={`btn petit-btn ${filtre === "corriger" ? "" : "secondaire"}`} aria-pressed={filtre === "corriger"} onClick={() => setFiltre("corriger")}>À corriger ({nbACorriger})</button>
            </div>
          )}
        </div>
        {historique.length === 0 && <Vide>{filtre === "corriger" ? "Aucune production en attente de correction." : "Rien pour l’instant."}</Vide>}
        <ul className="historique">
          {historique.map((t) => (
            <li key={t.id}>
              <button className="ligne-hist" onClick={() => setOuverte(ouverte === t.id ? undefined : t.id)} aria-expanded={ouverte === t.id}>
                <span className="petit">{dateFr(t.faiteLe, true)}</span>
                <span><BadgeComp c={t.competence} /> <Badge>{t.niveau}</Badge> {t.titre}</span>
                <span className="score">{t.score}/{t.max}{t.noteProf != null && <> · prof : {t.noteProf}/20</>}</span>
                <span>{t.commentaireProf ? <span title="Commentaire du professeur">💬</span> : prof && aCorriger(t) ? <Badge ton="info">à corriger</Badge> : null}</span>
              </button>
              {ouverte === t.id && <DetailTentative t={t} peutCommenter={prof} />}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function Courbe({ ts }: { ts: Tentative[] }) {
  const points = [...ts].reverse().slice(-30);
  if (points.length < 2) return null;
  const L = 600, H = 150, mg = 30, mh = 16;
  const x = (i: number) => mg + (i * (L - mg - 12)) / (points.length - 1);
  const y = (v: number) => H - mh - v * (H - 2 * mh);
  const d = points.map((t, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(taux(t)).toFixed(1)}`).join(" ");
  return (
    <section className="carte">
      <h2>Évolution (30 dernières activités)</h2>
      <svg viewBox={`0 0 ${L} ${H}`} className="courbe" role="img" aria-label="Évolution du taux de réussite, en pourcentage">
        {[0, 0.5, 1].map((v) => (
          <g key={v}><line x1={mg} x2={L - 12} y1={y(v)} y2={y(v)} className="grille-ligne" /><text x={mg - 6} y={y(v) + 4} className="axe" textAnchor="end">{v * 100}</text></g>
        ))}
        <path d={d} className="trace" />
        {points.map((t, i) => <circle key={t.id} cx={x(i)} cy={y(taux(t))} r={4} className={`pt comp-${t.competence}`}><title>{`${t.titre} : ${pct(taux(t))}`}</title></circle>)}
      </svg>
    </section>
  );
}

function DetailTentative({ t, peutCommenter }: { t: Tentative; peutCommenter: boolean }) {
  const [com, setCom] = useState(t.commentaireProf ?? "");
  const [note, setNote] = useState(t.noteProf?.toString() ?? "");
  const [msg, setMsg] = useState<{ ok: boolean; t: string }>();
  return (
    <div className="detail-tentative">
      {t.reponses && (
        <div className="tableau-defile">
          <table className="tableau petit">
            <thead><tr><th>Question</th><th>Réponse de l’élève</th></tr></thead>
            <tbody>{Object.entries(t.reponses).map(([k, v]) => <tr key={k}><td>{k}</td><td>{v}</td></tr>)}</tbody>
          </table>
        </div>
      )}
      {t.production && (
        <>
          <p className="petit">{t.competence === "PO" ? "Transcription de la prise de parole" : "Production de l’élève"}</p>
          <blockquote className="production">{t.production}</blockquote>
        </>
      )}
      {t.correction && <CorrectionVue c={t.correction} />}
      {t.commentaireProf && !peutCommenter && (
        <div className="carte commentaire-prof"><b>Commentaire du professeur{t.noteProf != null ? ` (${t.noteProf}/20)` : ""} :</b><p>{t.commentaireProf}</p></div>
      )}
      {peutCommenter && (
        <form className="commentaire-form" onSubmit={async (e) => {
          e.preventDefault();
          try {
            await backend.commenterTentative(t.id, com, note === "" ? undefined : Number(note));
            setMsg({ ok: true, t: "Commentaire enregistré : l’élève le voit dans ses progrès." });
          } catch (x) { setMsg({ ok: false, t: (x as Error).message }); }
        }}>
          <label className="champ">Commentaire du professeur<textarea rows={3} value={com} onChange={(e) => setCom(e.target.value)} /></label>
          <label className="champ court">Note /20 (facultatif)<input type="number" min={0} max={20} step={0.5} value={note} onChange={(e) => setNote(e.target.value)} /></label>
          <button className="btn">Enregistrer</button>
          {msg && <span className={`petit ${msg.ok ? "" : "texte-alerte"}`} role="status"> {msg.t}</span>}
        </form>
      )}
    </div>
  );
}
