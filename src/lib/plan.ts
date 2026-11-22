import { ACTIVITES, activite, type Activite } from "../data/activities.ts";
import { toutesFiches } from "../data/levels.ts";
import { THEMES, idQuizLexique } from "../data/themes.ts";
import { EXAMENS_BLANCS } from "../data/examensBlancs.ts";
import { COMPETENCES, type Competence, type Devoir, type Niveau, type PlanIA, type PlanStructure, type Profil, type TachePlan, type Tentative } from "./types.ts";
import { joursAvant, pct, statistiques, taux, TEST_NIVEAU_ID } from "./util.ts";

/**
 * Parcours de l’élève : niveau de travail, prochaine étape, suggestions et plan d’amélioration.
 * Tout est calculé à partir des résultats et du contenu de l’application : le plan existe donc
 * même sans IA, et chaque tâche renvoie à une fiche, une révision, une activité ou un examen blanc.
 */

type Objectif = Pick<Profil, "niveauVise" | "examenVise" | "dateExamen">;
const COMPS: Competence[] = ["CO", "CE", "PE", "PO", "LS"];
const horsBanque = (a: Activite) => a.id.startsWith("eb-") || a.id.startsWith("lexique-");

/** Niveau de travail : niveau visé, sinon résultat du test de niveau, sinon niveau le plus pratiqué. */
export function niveauCible(ts: Tentative[], o: Objectif): Niveau {
  if (o.niveauVise) return o.niveauVise;
  const test = ts.find((t) => t.activiteId === TEST_NIVEAU_ID);
  if (test) return test.niveau;
  const compte = new Map<Niveau, number>();
  for (const t of ts) compte.set(t.niveau, (compte.get(t.niveau) ?? 0) + 1);
  return [...compte.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "A2";
}

/** Meilleur taux de réussite obtenu pour chaque activité. */
function meilleurs(ts: Tentative[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const t of ts) m.set(t.activiteId, Math.max(m.get(t.activiteId) ?? 0, taux(t)));
  return m;
}

/** Activités ordinaires (hors examens blancs et quiz de lexique) d’un niveau et d’une compétence. */
const banque = (niveau: Niveau, c: Competence) => ACTIVITES.filter((a) => a.niveau === niveau && a.competence === c && !horsBanque(a));

/** Compétences classées de la moins travaillée ou la plus faible à la plus solide. */
function classer(ts: Tentative[]): Competence[] {
  const stats = statistiques(ts);
  const moy = (c: Competence) => stats.find((s) => s.competence === c)?.moyenne ?? -1;
  return [...COMPS].sort((a, b) => moy(a) - moy(b));
}

/** Activités conseillées : pas encore faites, au niveau de travail, en commençant par les compétences faibles. */
export function suggestions(o: Objectif, ts: Tentative[], n = 4): Activite[] {
  const niveau = niveauCible(ts, o);
  const faites = meilleurs(ts);
  const res: Activite[] = [];
  const ordre = classer(ts);
  for (let tour = 0; tour < 4 && res.length < n; tour++) {
    for (const c of ordre) {
      if (res.length >= n) break;
      const libres = banque(niveau, c).filter((a) => !faites.has(a.id) && !res.includes(a));
      const a = libres.find((x) => !o.examenVise || x.examens.includes(o.examenVise)) ?? libres[0];
      if (a) res.push(a);
    }
  }
  return res;
}

export interface Etape {
  titre: string;
  texte: string;
  href: string;
  bouton: string;
}

/** La chose la plus utile à faire maintenant. */
export function prochaineEtape(o: Objectif, devoirs: Devoir[], ts: Tentative[], plan: PlanIA | null): Etape {
  // Le plus urgent d’abord ; à échéance égale, le plus ancien.
  const aFaire = devoirs
    .filter((d) => d.statut === "a_faire")
    .sort((a, b) => (a.echeance ?? "9999").localeCompare(b.echeance ?? "9999") || a.creeLe.localeCompare(b.creeLe));
  const d = aFaire[0];
  if (d) {
    const a = activite(d.activiteId);
    const quand = d.echeance ? ` — à rendre pour le ${new Date(d.echeance + "T00:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}` : "";
    return { titre: "Un devoir de votre professeur vous attend", texte: `${a?.titre ?? d.activiteId}${quand}.`, href: `#/activite/${d.activiteId}?devoir=${d.id}`, bouton: "Faire le devoir" };
  }
  if (!o.niveauVise && !ts.some((t) => t.activiteId === TEST_NIVEAU_ID))
    return { titre: "Commencez par situer votre niveau", texte: "24 questions graduées, environ 15 minutes : le test estime votre niveau et oriente vos activités.", href: "#/test-niveau", bouton: "Passer le test de niveau" };
  const faites = new Set(ts.map((t) => t.activiteId));
  for (const e of plan?.contenu?.etapes ?? [])
    for (const t of e.taches) {
      const id = t.ref?.startsWith("activite:") ? t.ref.slice(9) : "";
      if (id && !faites.has(id) && activite(id)) return { titre: "Suite de votre plan d’amélioration", texte: t.texte, href: `#/activite/${id}`, bouton: "Continuer" };
    }
  const s = suggestions(o, ts, 1)[0];
  if (s) return { titre: `À travailler : ${COMPETENCES[s.competence].toLowerCase()}`, texte: s.titre, href: `#/activite/${s.id}`, bouton: "Commencer" };
  const niveau = niveauCible(ts, o);
  const eb = EXAMENS_BLANCS.find((e) => e.niveau === niveau);
  if (eb) return { titre: "Prêt pour un examen blanc ?", texte: eb.titre, href: `#/examens-blancs/${eb.id}`, bouton: "Commencer l’examen" };
  return { titre: "Révisez le lexique", texte: `Les fiches thématiques du niveau ${niveau}.`, href: "#/revisions", bouton: "Réviser" };
}

const OBJECTIFS: Record<Competence, (n: Niveau) => string> = {
  CO: (n) => `Comprendre l’essentiel de documents sonores de niveau ${n} en deux écoutes, puis en une seule.`,
  CE: (n) => `Atteindre 70 % de réussite sur les textes de niveau ${n}, dans le temps indiqué.`,
  PE: (n) => `Rédiger un texte complet de niveau ${n}, à la bonne longueur, noté au moins 12/20.`,
  PO: (n) => `Tenir la durée de parole prévue au niveau ${n}, avec un plan annoncé et des exemples.`,
  LS: (n) => `Réussir au moins 80 % des exercices de grammaire et de lexique de niveau ${n}.`,
};

/** Plan sur deux semaines, calculé sans IA. */
export function planLocal(ts: Tentative[], o: Objectif): { plan: PlanStructure; texte: string } {
  const niveau = niveauCible(ts, o);
  const utiles = ts.filter((t) => t.activiteId !== TEST_NIVEAU_ID);
  const stats = statistiques(utiles);
  const stat = (c: Competence) => stats.find((s) => s.competence === c);
  const faites = meilleurs(utiles);
  const ordre = classer(utiles);
  const prio = ordre.filter((c) => (stat(c)?.moyenne ?? -1) < 0.75).slice(0, 2);
  if (!prio.length) prio.push(ordre[0]);

  const priorites = prio.map((c) => {
    const s = stat(c);
    const constat = s
      ? `Réussite moyenne de ${pct(s.moyenne)} sur ${s.nb} activité${s.nb > 1 ? "s" : ""}${s.tendance > 0.05 ? ", en progrès" : s.tendance < -0.05 ? ", en baisse" : ""}.`
      : "Compétence pas encore travaillée.";
    return { competence: c, constat, objectif: OBJECTIFS[c](niveau) };
  });

  const fiches = toutesFiches();
  const s1: TachePlan[] = [{ texte: "Chaque jour : 20 à 30 minutes de pratique, plutôt qu’une longue séance par semaine." }];
  const s2: TachePlan[] = [];
  for (const c of prio) {
    const fiche = fiches.find((f) => f.niveau === niveau && f.competence === c);
    if (fiche) s1.push({ texte: `Lire la fiche « ${fiche.titre} » et noter trois exemples personnels.`, ref: `fiche:${fiche.id}` });
    const acts = banque(niveau, c);
    const nouvelles = acts.filter((a) => !faites.has(a.id));
    const aRefaire = acts.filter((a) => (faites.get(a.id) ?? 1) < 0.6);
    if (nouvelles[0]) s1.push({ texte: `Faire l’activité « ${nouvelles[0].titre} ».`, ref: `activite:${nouvelles[0].id}` });
    if (aRefaire[0]) s2.push({ texte: `Refaire « ${aRefaire[0].titre} » (réussite actuelle : ${pct(faites.get(aRefaire[0].id) ?? 0)}) après avoir relu le corrigé.`, ref: `activite:${aRefaire[0].id}` });
    else if (nouvelles[1]) s2.push({ texte: `Faire l’activité « ${nouvelles[1].titre} ».`, ref: `activite:${nouvelles[1].id}` });
  }
  const theme = THEMES.find((t) => t.niveau === niveau && !faites.has(idQuizLexique(t.id))) ?? THEMES.find((t) => t.niveau === niveau);
  if (theme) s1.push({ texte: `Réviser le lexique « ${theme.theme} » avec les cartes, puis faire le quiz.`, ref: `theme:${theme.id}` });
  const eb = EXAMENS_BLANCS.find((e) => e.niveau === niveau && (!o.examenVise || e.examen === o.examenVise)) ?? EXAMENS_BLANCS.find((e) => e.niveau === niveau);
  if (eb) s2.push({ texte: `Passer « ${eb.titre} » en respectant les durées de chaque épreuve.`, ref: `examen-blanc:${eb.id}` });
  else s2.push({ texte: `Faire une activité de chaque compétence au niveau ${niveau}, en temps limité.` });

  const etapes = [
    { titre: "Semaine 1 : comprendre et pratiquer", taches: s1 },
    { titre: "Semaine 2 : consolider et se tester", taches: s2 },
  ];
  const j = o.dateExamen ? joursAvant(o.dateExamen) : null;
  if (j !== null && j >= 0 && j <= 45)
    etapes.push({
      titre: `D’ici l’examen (J-${j})`,
      taches: [
        { texte: "Un examen blanc complet par semaine, dans les conditions réelles." },
        { texte: "Relire les rubriques « Conseils » et « Pièges fréquents » de votre examen." },
        { texte: "La veille : pas de nouvelle notion, seulement des relectures et du repos." },
      ],
    });

  const meilleure = [...stats].sort((a, b) => b.moyenne - a.moyenne)[0];
  const moyenne = utiles.length ? utiles.reduce((s, t) => s + taux(t), 0) / utiles.length : 0;
  const diagnostic = utiles.length
    ? `Sur ${utiles.length} activité${utiles.length > 1 ? "s" : ""}, votre réussite moyenne est de ${pct(moyenne)}.${meilleure ? ` Point fort : ${COMPETENCES[meilleure.competence].toLowerCase()} (${pct(meilleure.moyenne)}).` : ""} À travailler en priorité : ${prio.map((c) => COMPETENCES[c].toLowerCase()).join(" et ")}. Niveau de travail : ${niveau}.`
    : `Aucune activité enregistrée pour l’instant : ce plan de départ vous fait découvrir les compétences du niveau ${niveau}.`;
  const indicateurs = [
    `${COMPETENCES[prio[0]]} : au moins 70 % sur deux activités consécutives de niveau ${niveau}.`,
    "Une activité par jour pendant 14 jours (votre série s’affiche sur l’accueil).",
    eb ? "Examen blanc : au moins 50/100, sans épreuve sous 5/25." : "Productions écrites : la longueur demandée, dans le temps imparti.",
  ];
  const plan: PlanStructure = { diagnostic, priorites, etapes, indicateurs, source: "local" };
  return { plan, texte: planEnTexte(plan) };
}

export function planEnTexte(p: PlanStructure): string {
  const l: string[] = [p.diagnostic, ""];
  if (p.priorites.length) {
    l.push("Priorités");
    for (const x of p.priorites) l.push(`- ${COMPETENCES[x.competence]} : ${x.constat} Objectif : ${x.objectif}`);
    l.push("");
  }
  for (const e of p.etapes) {
    l.push(e.titre);
    for (const t of e.taches) l.push(`- ${t.texte}`);
    l.push("");
  }
  if (p.indicateurs.length) {
    l.push("Indicateurs de progrès");
    for (const i of p.indicateurs) l.push(`- ${i}`);
  }
  return l.join("\n").trim();
}

/** Lien vers le contenu désigné par une référence de plan, ou null si elle n’existe pas. */
export function resoudreRef(ref?: string): { href: string; label: string } | null {
  if (!ref) return null;
  const i = ref.indexOf(":");
  const type = ref.slice(0, i);
  const id = ref.slice(i + 1);
  switch (type) {
    case "fiche":
      return toutesFiches().some((f) => f.id === id) ? { href: `#/fiche/${id}`, label: "Ouvrir la fiche" } : null;
    case "theme":
      return THEMES.some((t) => t.id === id) ? { href: `#/revisions/${id}`, label: "Réviser" } : null;
    case "activite":
      return activite(id) ? { href: `#/activite/${id}`, label: "Faire l’activité" } : null;
    case "examen-blanc":
      return EXAMENS_BLANCS.some((e) => e.id === id) ? { href: `#/examens-blancs/${id}`, label: "Ouvrir l’examen blanc" } : null;
    default:
      return null;
  }
}

/** Supprime les références inconnues (un plan rédigé par l’IA ne peut renvoyer qu’à des contenus existants). */
export function validerPlan(p: PlanStructure): PlanStructure {
  return {
    ...p,
    priorites: p.priorites.filter((x) => x.competence in COMPETENCES),
    etapes: p.etapes.map((e) => ({ ...e, taches: e.taches.map((t) => (t.ref && resoudreRef(t.ref) ? t : { texte: t.texte })) })),
  };
}

/** Contenus d’un niveau, transmis à l’IA pour qu’elle construise un plan avec des références valides. */
export function catalogue(niveau: Niveau) {
  return {
    fiches: toutesFiches().filter((f) => f.niveau === niveau).map((f) => ({ ref: `fiche:${f.id}`, titre: f.titre, competence: f.competence })),
    revisions: THEMES.filter((t) => t.niveau === niveau).map((t) => ({ ref: `theme:${t.id}`, titre: t.theme })),
    activites: ACTIVITES.filter((a) => a.niveau === niveau && !horsBanque(a)).map((a) => ({ ref: `activite:${a.id}`, titre: a.titre, competence: a.competence })),
    examensBlancs: EXAMENS_BLANCS.filter((e) => e.niveau === niveau).map((e) => ({ ref: `examen-blanc:${e.id}`, titre: e.titre })),
  };
}
