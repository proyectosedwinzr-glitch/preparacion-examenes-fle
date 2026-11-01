import { useMemo, useState } from "react";
import { ACTIVITES } from "../data/activities";
import { EXAMENS } from "../data/exams";
import { COMPETENCES, NIVEAUX, type Competence } from "../lib/types";
import { useDonnee, useProfil } from "../lib/hooks";
import { backend } from "../lib/instance";
import { Badge, BadgeComp, Vide } from "../components/ui";
import Assigner from "../components/Assigner";

const TYPES = { qcm: "QCM", trous: "Texte à trous", production: "Production écrite", oral: "Tâche orale" } as const;

export default function Activites() {
  const { profil } = useProfil();
  const [niveau, setNiveau] = useState(profil.niveauVise ?? "");
  const [comp, setComp] = useState("");
  const [exam, setExam] = useState(profil.examenVise ?? "");
  const [q, setQ] = useState("");
  const [assigner, setAssigner] = useState<string>();
  const { data: ts } = useDonnee(() => (profil.role === "eleve" ? backend.tentatives(profil.id) : Promise.resolve([])), [profil.id]);
  const meilleurs = useMemo(() => {
    const m = new Map<string, number>();
    for (const t of ts ?? []) m.set(t.activiteId, Math.max(m.get(t.activiteId) ?? 0, t.score / t.max));
    return m;
  }, [ts]);

  const liste = ACTIVITES.filter(
    (a) =>
      (!niveau || a.niveau === niveau) &&
      (!comp || a.competence === comp) &&
      (!exam || a.examens.includes(exam as never)) &&
      (!q || (a.titre + " " + a.theme).toLowerCase().includes(q.toLowerCase())),
  );

  return (
    <div className="pile">
      <h1>{profil.role === "eleve" ? "Activités" : "Banque d’activités"}</h1>
      <p className="sous-titre">
        {ACTIVITES.length} activités de A1 à C2, classées par niveau, compétence, examen et thème.
        {profil.role === "professeur" && " Assignez-les à vos élèves : vous verrez leurs réponses et leurs résultats."}
      </p>
      <div className="filtres">
        <select aria-label="Niveau" value={niveau} onChange={(e) => setNiveau(e.target.value)}>
          <option value="">Tous les niveaux</option>
          {NIVEAUX.map((n) => <option key={n}>{n}</option>)}
        </select>
        <select aria-label="Compétence" value={comp} onChange={(e) => setComp(e.target.value)}>
          <option value="">Toutes les compétences</option>
          {(Object.keys(COMPETENCES) as Competence[]).map((c) => <option key={c} value={c}>{COMPETENCES[c]}</option>)}
        </select>
        <select aria-label="Examen" value={exam} onChange={(e) => setExam(e.target.value)}>
          <option value="">Tous les examens</option>
          {EXAMENS.map((e) => <option key={e.id} value={e.id}>{e.nom}</option>)}
        </select>
        <input type="search" aria-label="Rechercher" placeholder="Rechercher un thème…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      {liste.length === 0 && <Vide>Aucune activité ne correspond à ces filtres.</Vide>}
      <div className="grille-cartes">
        {liste.map((a) => {
          const m = meilleurs.get(a.id);
          return (
            <div key={a.id} className="mini-carte">
              <div className="badges"><Badge>{a.niveau}</Badge> <BadgeComp c={a.competence} /> <span className="petit">{TYPES[a.type]}</span>
                {m !== undefined && <Badge ton={m >= 0.75 ? "ok" : "attention"}>Fait · {Math.round(m * 100)} %</Badge>}
              </div>
              <a href={`#/activite/${a.id}`}><b>{a.titre}</b></a>
              <span className="petit">{a.theme} · {a.duree} min · {a.examens.map((e) => EXAMENS.find((x) => x.id === e)?.nom).join(", ")}</span>
              {profil.role === "professeur" && (
                <div className="actions"><a className="btn secondaire petit-btn" href={`#/activite/${a.id}`}>Aperçu</a><button className="btn petit-btn" onClick={() => setAssigner(a.id)}>Assigner</button></div>
              )}
            </div>
          );
        })}
      </div>
      {assigner && <Assigner activiteId={assigner} fermer={() => setAssigner(undefined)} />}
    </div>
  );
}
