// Vérifie la cohérence du contenu pédagogique : npm run check:content
import { ACTIVITES } from "../src/data/activities.ts";
import { NIVEAUX_CECRL } from "../src/data/levels.ts";
import { EXAMENS } from "../src/data/exams.ts";
import { EXAMENS_BLANCS } from "../src/data/examensBlancs.ts";
import { noterExamen } from "../src/lib/notation.ts";
import { THEMES, idQuizLexique } from "../src/data/themes.ts";
import { PISTES_PROF } from "../src/data/fiches2.ts";
import { TEST_NIVEAU, estimerNiveau } from "../src/data/testNiveau.ts";
import { planLocal, prochaineEtape, resoudreRef, suggestions } from "../src/lib/plan.ts";
import { rechercher } from "../src/lib/recherche.ts";
import { decouper } from "../src/lib/voix.ts";

const erreurs: string[] = [];
const ids = new Set<string>();
for (const a of ACTIVITES) {
  if (ids.has(a.id)) erreurs.push(`Identifiant en double : ${a.id}`);
  ids.add(a.id);
  for (const e of a.examens) if (!EXAMENS.some((x) => x.id === e)) erreurs.push(`${a.id} : examen inconnu ${e}`);
  if (a.type === "qcm") {
    a.items.forEach((it, i) => {
      if (it.bonne < 0 || it.bonne >= it.options.length) erreurs.push(`${a.id} Q${i + 1} : index de bonne réponse hors limites`);
      if (new Set(it.options).size !== it.options.length) erreurs.push(`${a.id} Q${i + 1} : options en double`);
    });
  }
  if (a.type === "trous")
    a.phrases.forEach((p, i) => {
      if (p.texte.split("___").length !== 2) erreurs.push(`${a.id} phrase ${i + 1} : il faut exactement un trou ___`);
      if (!p.reponses.length) erreurs.push(`${a.id} phrase ${i + 1} : aucune réponse`);
    });
  if (a.type === "production" && a.motsMax && a.motsMax < a.motsMin) erreurs.push(`${a.id} : motsMax < motsMin`);
}
for (const n of NIVEAUX_CECRL)
  for (const f of n.fiches) {
    for (const id of f.activites) if (!ids.has(id)) erreurs.push(`Fiche ${f.id} : activité inconnue ${id}`);
    if (f.niveau !== n.niveau) erreurs.push(`Fiche ${f.id} rangée au mauvais niveau`);
  }

for (const eb of EXAMENS_BLANCS) {
  for (const ep of eb.epreuves)
    for (const id of ep.activites) {
      const a = ACTIVITES.find((x) => x.id === id);
      if (!a) erreurs.push(`Examen blanc ${eb.id} : activité inconnue ${id}`);
      else if (a.competence !== ep.competence || a.niveau !== eb.niveau) erreurs.push(`Examen blanc ${eb.id} : ${id} ne correspond pas à l’épreuve ${ep.competence} ${eb.niveau}`);
    }
}

// Notation façon DELF sur un cas connu : 20 + 15 + 12 + 4 = 51/100 mais PO < 5 → non réussi.
{
  const eb = EXAMENS_BLANCS[0];
  const t = (activiteId: string, score: number, max: number) => ({ id: activiteId, eleveId: "e", activiteId, titre: "", niveau: eb.niveau, competence: "CO" as const, examens: [], score, max, faiteLe: "2026-01-01" });
  const [co, ce, pe, po] = eb.epreuves;
  const ts = [
    ...co.activites.map((id) => t(id, 4, 5)), // 0,8 → 20/25
    ...ce.activites.map((id) => t(id, 3, 5)), // 0,6 → 15/25
    ...pe.activites.map((id) => t(id, 9.6, 20)), // 0,48 → 12/25
    ...po.activites.map((id) => t(id, 4, 25)), // 0,16 → 4/25
  ];
  const n = noterExamen(eb, ts);
  const notes = n.epreuves.map((e) => e.note).join(",");
  if (notes !== "20,15,12,4" || n.total !== 51 || n.reussi !== false) erreurs.push(`Notation incorrecte : ${notes} = ${n.total}, réussi = ${n.reussi}`);
  const n2 = noterExamen(eb, ts.slice(0, -1));
  if (n2.total !== null || n2.reussi !== null) erreurs.push("Un examen incomplet ne doit pas avoir de total");
}

// Fiches : piste pour le professeur, au moins une activité
for (const n of NIVEAUX_CECRL)
  for (const f of n.fiches) {
    if (!PISTES_PROF[f.id]) erreurs.push(`Fiche ${f.id} : piste pour le professeur manquante`);
    if (!f.activites.length) erreurs.push(`Fiche ${f.id} : aucune activité associée`);
  }

// Révisions thématiques et quiz générés
const themeIds = new Set<string>();
for (const t of THEMES) {
  if (themeIds.has(t.id)) erreurs.push(`Révision en double : ${t.id}`);
  themeIds.add(t.id);
  if (t.lexique.length < 8) erreurs.push(`Révision ${t.id} : au moins 8 entrées de lexique`);
  if (new Set(t.lexique.map((e) => e.mot)).size !== t.lexique.length) erreurs.push(`Révision ${t.id} : mots en double`);
  for (const e of t.lexique) if (e.indice.toLowerCase().includes(e.mot.toLowerCase())) erreurs.push(`Révision ${t.id} : l’indice de « ${e.mot} » contient le mot`);
  if (t.expressions.length < 4 || t.aLoral.length < 3) erreurs.push(`Révision ${t.id} : expressions ou questions orales insuffisantes`);
  if (!ACTIVITES.some((a) => a.id === idQuizLexique(t.id))) erreurs.push(`Révision ${t.id} : quiz absent de la banque`);
}

// Test de niveau : 4 questions par niveau, estimation cohérente
for (const n of NIVEAUX_CECRL) if (TEST_NIVEAU.filter((it) => it.niveau === n.niveau).length !== 4) erreurs.push(`Test de niveau : il faut 4 questions ${n.niveau}`);
TEST_NIVEAU.forEach((it, i) => {
  if (it.bonne < 0 || it.bonne >= it.options.length || new Set(it.options).size !== it.options.length) erreurs.push(`Test de niveau, question ${i + 1} : options incorrectes`);
});
{
  const bonnes = TEST_NIVEAU.map((it) => it.bonne);
  const jusqua = (k: number) => TEST_NIVEAU.map((it, i) => (i < k * 4 ? it.bonne : undefined));
  const cas: [string, (number | undefined)[], string][] = [
    ["tout juste", bonnes, "C2"],
    ["rien", [], "A1"],
    ["A1 à B1 justes", jusqua(3), "B1"],
    ["B2 échoué puis C1 juste", TEST_NIVEAU.map((it, i) => (i < 12 || (i >= 16 && i < 20) ? it.bonne : undefined)), "B1"],
  ];
  for (const [nom, r, attendu] of cas) {
    const n = estimerNiveau(r).niveau;
    if (n !== attendu) erreurs.push(`Test de niveau (${nom}) : ${n} au lieu de ${attendu}`);
  }
}

// Plan d’amélioration et parcours : toutes les références renvoient à un contenu existant
{
  const t = (activiteId: string, score: number, max: number, competence: "CO" | "CE" | "PE" | "PO" | "LS") => ({ id: activiteId, eleveId: "e", activiteId, titre: activiteId, niveau: "B1" as const, competence, examens: [], score, max, faiteLe: "2026-11-01T10:00:00Z" });
  const ts = [t("b1-ce-teletravail", 2, 5, "CE"), t("b1-ls-relatifs", 6, 7, "LS"), t("b1-co-radio", 1, 4, "CO")];
  for (const [nom, essai] of [["vide", []], ["résultats B1", ts]] as const) {
    const { plan, texte } = planLocal([...essai], { niveauVise: "B1", examenVise: "delf" });
    if (!texte || plan.etapes.length < 2) erreurs.push(`Plan (${nom}) : incomplet`);
    for (const e of plan.etapes) for (const tache of e.taches) if (tache.ref && !resoudreRef(tache.ref)) erreurs.push(`Plan (${nom}) : référence inconnue ${tache.ref}`);
  }
  const prio = planLocal(ts, { niveauVise: "B1" }).plan.priorites.map((p) => p.competence);
  if (prio[0] !== "PE" && prio[0] !== "PO") erreurs.push(`Plan : une compétence jamais travaillée devrait passer en premier (obtenu ${prio.join(", ")})`);
  if (suggestions({ niveauVise: "B1" }, ts, 4).some((a) => ts.some((x) => x.activiteId === a.id))) erreurs.push("Suggestions : une activité déjà faite est proposée");
  if (prochaineEtape({}, [], [], null).href !== "#/test-niveau") erreurs.push("Prochaine étape : le test de niveau doit être proposé à un nouvel élève");
}

// Recherche du tuteur (sans IA) et découpage des dialogues
if (!rechercher("Quand employer le subjonctif ?").some((r) => r.href.includes("subjonctif"))) erreurs.push("Recherche : la fiche sur le subjonctif devrait être trouvée");
if (decouper("Journaliste : Bonjour.\nInvitée : Merci.").map((r) => r.locuteur).join(",") !== "Journaliste,Invitée") erreurs.push("Dialogues : locuteurs mal découpés");
for (const a of ACTIVITES)
  if ((a.type === "qcm" || a.type === "oral") && a.support?.nature === "audio" && decouper(a.support.contenu).some((r) => r.locuteur && r.locuteur.split(" ").length > 3))
    erreurs.push(`${a.id} : un locuteur de dialogue semble mal détecté`);

// Typographie : apostrophe droite dans le texte affiché (hors réponses acceptées), doubles espaces.
const texte = JSON.stringify({ ACTIVITES, NIVEAUX_CECRL, EXAMENS });
const droites = texte.match(/[A-Za-zÀ-ÿ]'[A-Za-zÀ-ÿ]/g);
if (droites) erreurs.push(`Apostrophes droites à remplacer par ’ : ${[...new Set(droites)].slice(0, 10).join(" ")}`);
if (/[^\n ]  +[^ ]/.test(texte.replace(/\\n/g, "\n"))) erreurs.push("Doubles espaces détectées");

const parNiveau = Object.fromEntries(NIVEAUX_CECRL.map((n) => [n.niveau, ACTIVITES.filter((a) => a.niveau === n.niveau).length]));
console.log(`${ACTIVITES.length} activités`, parNiveau, `· ${NIVEAUX_CECRL.reduce((s, n) => s + n.fiches.length, 0)} fiches · ${THEMES.length} révisions · ${EXAMENS_BLANCS.length} examens blancs · ${TEST_NIVEAU.length} questions de test · ${EXAMENS.length} examens`);
if (erreurs.length) {
  console.error(erreurs.map((e) => "✗ " + e).join("\n"));
  process.exit(1);
}
console.log("✓ Contenu cohérent");
