import { useState } from "react";
import { backend } from "../lib/instance";
import { useDonnee, useProfil } from "../lib/hooks";
import { planAmelioration } from "../lib/ai";
import { COMPETENCES, NIVEAUX, type Tentative } from "../lib/types";
import { dateFr, pct, statistiques } from "../lib/util";
import { Badge, BadgeComp, Jauge, Paragraphes, Vide } from "../components/ui";
import CorrectionVue from "../components/CorrectionVue";
import { EXAMENS } from "../data/exams";

/**
 * Vue partagée : l’élève et son professeur voient exactement les mêmes données.
 * Le professeur peut en plus commenter et noter chaque tentative.
 */
export default function Progres({ eleveId, nomEleve }: { eleveId: string; nomEleve?: string }) {
  const { profil } = useProfil();
  const estEleve = profil.id === eleveId;
  const { data: ts } = useDonnee(() => backend.tentatives(eleveId), [eleveId]);
  const { data: plan } = useDonnee(() => backend.plan(eleveId), [eleveId]);
  const [genere, setGenere] = useState(false);
  const [erreur, setErreur] = useState("");
  const [ouverte, setOuverte] = useState<string>();

  const liste = ts ?? [];
  const stats = statistiques(liste);
  const parNiveau = NIVEAUX.map((n) => {
    const l = liste.filter((t) => t.niveau === n);
    return { n, nb: l.length, moy: l.length ? l.reduce((s, t) => s + t.score / t.max, 0) / l.length : 0 };
  }).filter((x) => x.nb > 0);

  async function generer() {
    setGenere(true);
    setErreur("");
    try {
      const texte = await planAmelioration(liste, profil.langueIA, profil.niveauVise, EXAMENS.find((e) => e.id === profil.examenVise)?.nom);
      await backend.enregistrerPlan(texte);
    } catch (e) {
      setErreur((e as Error).message);
    } finally {
      setGenere(false);
    }
  }

  return (
    <div className="pile">
      <h1>{estEleve ? "Mes progrès" : `Progrès de ${nomEleve ?? "l’élève"}`}</h1>
      {liste.length === 0 ? (
        <Vide>Aucune activité réalisée pour l’instant.</Vide>
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
                    <span className="petit">{s.nb} act.{s.tendance !== 0 && <> · {s.tendance > 0 ? "↗" : "↘"} {Math.abs(Math.round(s.tendance * 100))} pts</>}</span>
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

      <section className="carte">
        <div className="titre-ligne">
          <h2>Plan d’amélioration</h2>
          {estEleve && <button className="btn" onClick={generer} disabled={genere || liste.length === 0}>{genere ? "Génération…" : plan ? "Actualiser le plan" : "Générer mon plan (IA)"}</button>}
        </div>
        {erreur && <p className="erreur">{erreur}</p>}
        {plan ? <><p className="petit">Créé le {dateFr(plan.creeLe)}</p><Paragraphes texte={plan.texte} /></> : <Vide>Pas encore de plan. {estEleve ? "Faites quelques activités, puis générez-le." : ""}</Vide>}
      </section>

      <section className="carte">
        <h2>Historique</h2>
        {liste.length === 0 && <Vide>Rien pour l’instant.</Vide>}
        <ul className="historique">
          {liste.map((t) => (
            <li key={t.id}>
              <button className="ligne-hist" onClick={() => setOuverte(ouverte === t.id ? undefined : t.id)} aria-expanded={ouverte === t.id}>
                <span className="petit">{dateFr(t.faiteLe, true)}</span>
                <span><BadgeComp c={t.competence} /> <Badge>{t.niveau}</Badge> {t.titre}</span>
                <span className="score">{t.score}/{t.max}{t.noteProf != null && <> · prof : {t.noteProf}/20</>}</span>
                {t.commentaireProf && <span title="Commentaire du professeur">💬</span>}
              </button>
              {ouverte === t.id && <DetailTentative t={t} peutCommenter={profil.role === "professeur"} />}
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
  const L = 600, H = 140, m = 24;
  const x = (i: number) => m + (i * (L - 2 * m)) / (points.length - 1);
  const y = (v: number) => H - m - v * (H - 2 * m);
  const d = points.map((t, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(t.score / t.max).toFixed(1)}`).join(" ");
  return (
    <section className="carte">
      <h2>Évolution (30 dernières activités)</h2>
      <svg viewBox={`0 0 ${L} ${H}`} className="courbe" role="img" aria-label="Évolution du taux de réussite">
        {[0, 0.5, 1].map((v) => (
          <g key={v}><line x1={m} x2={L - m} y1={y(v)} y2={y(v)} className="grille-ligne" /><text x={2} y={y(v) + 4} className="axe">{v * 100}</text></g>
        ))}
        <path d={d} className="trace" />
        {points.map((t, i) => <circle key={t.id} cx={x(i)} cy={y(t.score / t.max)} r={3.5} className={`pt comp-${t.competence}`}><title>{`${t.titre} : ${t.score}/${t.max}`}</title></circle>)}
      </svg>
    </section>
  );
}

function DetailTentative({ t, peutCommenter }: { t: Tentative; peutCommenter: boolean }) {
  const [com, setCom] = useState(t.commentaireProf ?? "");
  const [note, setNote] = useState(t.noteProf?.toString() ?? "");
  const [msg, setMsg] = useState("");
  return (
    <div className="detail-tentative">
      {t.reponses && (
        <table className="tableau petit">
          <thead><tr><th>Question</th><th>Réponse de l’élève</th></tr></thead>
          <tbody>{Object.entries(t.reponses).map(([k, v]) => <tr key={k}><td>{k}</td><td>{v}</td></tr>)}</tbody>
        </table>
      )}
      {t.production && <blockquote className="production">{t.production}</blockquote>}
      {t.correction && <CorrectionVue c={t.correction} />}
      {t.commentaireProf && !peutCommenter && (
        <div className="carte commentaire-prof"><b>Commentaire du professeur{t.noteProf != null ? ` (${t.noteProf}/20)` : ""} :</b><p>{t.commentaireProf}</p></div>
      )}
      {peutCommenter && (
        <form className="commentaire-form" onSubmit={async (e) => {
          e.preventDefault();
          try {
            await backend.commenterTentative(t.id, com, note === "" ? undefined : Number(note));
            setMsg("Commentaire enregistré : l’élève le voit dans ses progrès.");
          } catch (x) { setMsg((x as Error).message); }
        }}>
          <label className="champ">Commentaire du professeur<textarea rows={3} value={com} onChange={(e) => setCom(e.target.value)} /></label>
          <label className="champ court">Note /20 (facultatif)<input type="number" min={0} max={20} step={0.5} value={note} onChange={(e) => setNote(e.target.value)} /></label>
          <button className="btn">Enregistrer</button>
          {msg && <span className="petit" role="status"> {msg}</span>}
        </form>
      )}
    </div>
  );
}
