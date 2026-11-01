// Vérifie la cohérence du contenu pédagogique : npm run check:content
import { ACTIVITES } from "../src/data/activities.ts";
import { NIVEAUX_CECRL } from "../src/data/levels.ts";
import { EXAMENS } from "../src/data/exams.ts";
import { EXAMENS_BLANCS } from "../src/data/examensBlancs.ts";
import { noterExamen } from "../src/lib/notation.ts";

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

// Typographie : apostrophe droite dans le texte affiché (hors réponses acceptées), doubles espaces.
const texte = JSON.stringify({ ACTIVITES, NIVEAUX_CECRL, EXAMENS });
const droites = texte.match(/[A-Za-zÀ-ÿ]'[A-Za-zÀ-ÿ]/g);
if (droites) erreurs.push(`Apostrophes droites à remplacer par ’ : ${[...new Set(droites)].slice(0, 10).join(" ")}`);
if (/[^\n ]  +[^ ]/.test(texte.replace(/\\n/g, "\n"))) erreurs.push("Doubles espaces détectées");

const parNiveau = Object.fromEntries(NIVEAUX_CECRL.map((n) => [n.niveau, ACTIVITES.filter((a) => a.niveau === n.niveau).length]));
console.log(`${ACTIVITES.length} activités`, parNiveau, `· ${NIVEAUX_CECRL.reduce((s, n) => s + n.fiches.length, 0)} fiches · ${EXAMENS.length} examens`);
if (erreurs.length) {
  console.error(erreurs.map((e) => "✗ " + e).join("\n"));
  process.exit(1);
}
console.log("✓ Contenu cohérent");
