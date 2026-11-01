// Génère le cahier de relecture pédagogique (HTML) à partir des données de l’application.
// Usage : node --experimental-strip-types scripts/export-revision.ts <fichier.html>
import { writeFileSync } from "node:fs";
import { ACTIVITES, type Activite } from "../src/data/activities.ts";
import { NIVEAUX_CECRL } from "../src/data/levels.ts";
import { EXAMENS, AVERTISSEMENT_EXAMENS } from "../src/data/exams.ts";

const sortie = process.argv[2] ?? "revision.html";
const e = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const typo = (t: string) =>
  e(t).replace(/ ([;!?])/g, " $1").replace(/ :(\s|$)/g, " :$1").replace(/« /g, "« ").replace(/ »/g, " »");
const p = (t: string) => t.split(/\n+/).map((l) => `<p>${typo(l)}</p>`).join("");
const ul = (l: string[]) => `<ul>${l.map((x) => `<li>${typo(x)}</li>`).join("")}</ul>`;
const COMP: Record<string, string> = { CO: "Compréhension de l’oral", CE: "Compréhension des écrits", PE: "Production écrite", PO: "Production orale", LS: "Lexique et structures" };
const nomExam = (id: string) => EXAMENS.find((x) => x.id === id)?.nom ?? id;

function activite(a: Activite): string {
  const tete = `<header class="item-tete"><span class="ref">${a.id}</span><h4>${typo(a.titre)}</h4>
    <p class="meta"><span class="niv">${a.niveau}</span> <span class="comp c-${a.competence}">${a.competence}</span> ${typo(a.theme)} · ${a.duree} min · ${a.examens.map(nomExam).join(", ")}</p>
    <p class="consigne">${typo(a.consigne)}</p></header>`;
  let corps = "";
  if (a.type === "qcm") {
    if (a.support) corps += `<div class="support"><p class="etiquette">${a.support.nature === "audio" ? `Transcription audio (${a.support.ecoutesMax ?? 2} écoute(s))` : "Document"} — ${typo(a.support.titre)}</p>${p(a.support.contenu)}</div>`;
    corps += `<ol class="qs">${a.items
      .map((it) => `<li><p class="q">${typo(it.q)}</p><ul class="opts">${it.options.map((o, k) => `<li class="${k === it.bonne ? "bonne" : ""}">${typo(o)}</li>`).join("")}</ul><p class="expl">${typo(it.explication)}</p></li>`)
      .join("")}</ol>`;
  } else if (a.type === "trous") {
    corps += `<ol class="qs">${a.phrases
      .map((ph) => `<li><p class="q">${typo(ph.texte).replace("___", `<mark>${e(ph.reponses.join(" / "))}</mark>`)}</p><p class="expl">${typo(ph.explication)}</p></li>`)
      .join("")}</ol>`;
  } else if (a.type === "production") {
    if (a.documents) corps += a.documents.map((d) => `<div class="support"><p class="etiquette">${typo(d.titre)}</p>${p(d.texte)}</div>`).join("");
    corps += `<p class="etiquette">Longueur : ${a.motsMin}${a.motsMax ? ` à ${a.motsMax}` : "+"} mots · grille</p>${ul(a.grille)}`;
  } else {
    corps += `<p class="etiquette">Préparation ${a.preparation} min · parole ${a.parole} min · auto-évaluation</p>${ul(a.points)}<p class="etiquette">Aide proposée</p>${ul(a.aide)}`;
  }
  return `<article class="item" id="${a.id}">${tete}${corps}<p class="avis">Avis du correcteur : ☐ validé ☐ à corriger</p></article>`;
}

const examens = EXAMENS.map(
  (x) => `<article class="item" id="exam-${x.id}"><header class="item-tete"><span class="ref">exam-${x.id}</span><h4>${e(x.nom)} — ${typo(x.nomComplet)}</h4>
  <p class="meta">${typo(x.organisme)} · ${x.niveaux.join(", ")} · <a href="${e(x.lienOfficiel)}" target="_blank" rel="noopener">site officiel</a></p></header>
  <p><b>Public :</b> ${typo(x.public)}</p>${ul(x.usages)}<p><b>Résultats :</b> ${typo(x.resultat)}</p><p><b>Validité :</b> ${typo(x.validite)}</p>
  <div class="tab"><table><thead><tr><th>Épreuve</th><th>Durée</th><th>Format</th><th>Évalue</th></tr></thead><tbody>${x.epreuves
    .map((ep) => `<tr><td><span class="comp c-${ep.competence}">${ep.competence}</span> ${typo(ep.nom)}</td><td>${typo(ep.duree)}</td><td>${typo(ep.format)}</td><td>${ep.evalue.map(typo).join(" ; ")}</td></tr>`)
    .join("")}</tbody></table></div>
  <div class="support"><p class="etiquette">Exemple — ${typo(x.exemple.epreuve)}</p><p>${typo(x.exemple.consigne)}</p><p><i>Attendu :</i> ${typo(x.exemple.attendu)}</p></div>
  <div class="deux"><div><p class="etiquette">Conseils</p>${ul(x.conseils)}</div><div><p class="etiquette">Pièges</p>${ul(x.pieges)}</div></div>
  <p class="avis">Avis du correcteur : ☐ validé ☐ à corriger</p></article>`,
).join("");

const niveaux = NIVEAUX_CECRL.map(
  (n) => `<section class="niveau" id="niveau-${n.niveau}"><h3>${n.niveau} · ${typo(n.nom)}</h3><p>${typo(n.resume)} <span class="meta">(${typo(n.heures)})</span></p>
  <div class="quatre">${(["CO", "CE", "PE", "PO"] as const).map((c) => `<div><p class="etiquette">${COMP[c]}</p>${ul(n.savoirFaire[c])}</div>`).join("")}</div>
  <div class="trois"><div><p class="etiquette">Thèmes</p>${ul(n.themes)}</div><div><p class="etiquette">Grammaire</p>${ul(n.grammaire)}</div><div><p class="etiquette">Lexique</p>${ul(n.lexique)}</div></div>
  ${n.fiches
    .map(
      (f) => `<article class="item" id="${f.id}"><header class="item-tete"><span class="ref">${f.id}</span><h4>${typo(f.titre)}</h4><p class="meta"><span class="comp c-${f.competence}">${f.competence}</span> Objectif : ${typo(f.objectif)}</p></header>
      ${f.explication.map((x) => `<p>${typo(x)}</p>`).join("")}
      ${f.tableau ? `<div class="tab"><table><thead><tr>${f.tableau[0].map((c) => `<th>${typo(c)}</th>`).join("")}</tr></thead><tbody>${f.tableau.slice(1).map((l) => `<tr>${l.map((c) => `<td>${typo(c)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>` : ""}
      <p class="etiquette">Exemples</p>${ul(f.exemples)}<div class="deux"><div><p class="etiquette">À retenir</p>${ul(f.aRetenir)}</div><div><p class="etiquette">Piège fréquent</p><p>${typo(f.piege)}</p></div></div>
      <p class="avis">Avis du correcteur : ☐ validé ☐ à corriger</p></article>`,
    )
    .join("")}</section>`,
).join("");

const parNiveau = NIVEAUX_CECRL.map((n) => {
  const l = ACTIVITES.filter((a) => a.niveau === n.niveau);
  return `<section class="niveau" id="act-${n.niveau}"><h3>Activités ${n.niveau} <span class="meta">(${l.length})</span></h3>${l.map(activite).join("")}</section>`;
}).join("");

const nbQ = ACTIVITES.reduce((s, a) => s + (a.type === "qcm" ? a.items.length : a.type === "trous" ? a.phrases.length : 1), 0);
const date = new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

const html = `<title>Cahier de relecture Tremplin</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Literata:opsz,wght@7..72,400;7..72,600&family=Atkinson+Hyperlegible:wght@400;700&display=swap">
<style>
/* Mise en page : une colonne de lecture, sommaire en tête ; l’encre bleue du texte, le rouge du correcteur pour les réponses attendues. */
:root{--papier:#fbfaf7;--carte:#ffffff;--encre:#1b2a41;--encre-2:#56627a;--trait:#e1dfd8;--bleu:#24508f;--rouge:#b3261e;--vert:#2f7a4b;--surligne:#fdeeb3;
--f-titre:"Literata",Georgia,"Times New Roman",serif;--f-texte:"Atkinson Hyperlegible",system-ui,-apple-system,"Segoe UI",sans-serif;
--CO:#6a4c93;--CE:#1f77b4;--PE:#c0553d;--PO:#2a9d8f;--LS:#7a6f5a}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--papier:#14181f;--carte:#1b212b;--encre:#e6e9ee;--encre-2:#a2acbb;--trait:#2d3542;--bleu:#8fb6ea;--rouge:#f28b82;--vert:#7ccf9b;--surligne:#4a3e12;color-scheme:dark}}
:root[data-theme="dark"]{--papier:#14181f;--carte:#1b212b;--encre:#e6e9ee;--encre-2:#a2acbb;--trait:#2d3542;--bleu:#8fb6ea;--rouge:#f28b82;--vert:#7ccf9b;--surligne:#4a3e12;color-scheme:dark}
body{background:var(--papier);color:var(--encre);font:16px/1.6 var(--f-texte)}
.page{max-width:860px;margin:0 auto;padding-block:32px 64px;padding-left:max(16px,env(safe-area-inset-left,0px));padding-right:max(16px,env(safe-area-inset-right,0px))}
h1,h2,h3,h4{font-family:var(--f-titre);font-weight:600;line-height:1.25;text-wrap:balance;margin:0}
h1{font-size:2rem}h2{font-size:1.5rem;margin-top:48px;padding-bottom:8px;border-bottom:2px solid var(--encre)}h3{font-size:1.2rem;margin:32px 0 12px}h4{font-size:1.05rem}
p{margin:0 0 8px}ul,ol{margin:0 0 8px;padding-left:1.3em}a{color:var(--bleu)}
.chapeau{color:var(--encre-2);max-width:65ch}
.mode{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;margin:20px 0}
.mode div{background:var(--carte);border:1px solid var(--trait);border-radius:8px;padding:12px 14px}
.chiffre{font-family:var(--f-titre);font-size:1.6rem;font-variant-numeric:tabular-nums}
nav.sommaire{display:flex;flex-wrap:wrap;gap:6px 14px;font-size:.95rem}
.item{background:var(--carte);border:1px solid var(--trait);border-radius:8px;padding:16px 18px;margin:14px 0;min-width:0}
.item-tete{display:grid;gap:4px;margin-bottom:10px}
.ref{font:12px/1 ui-monospace,SFMono-Regular,Menlo,monospace;color:var(--encre-2);letter-spacing:.02em}
.meta{font-size:.875rem;color:var(--encre-2)}
.consigne{font-weight:700}
.etiquette{font-size:.78rem;text-transform:uppercase;letter-spacing:.06em;color:var(--encre-2);margin:12px 0 4px}
.support{border-left:3px solid var(--trait);padding:4px 0 4px 14px;margin:10px 0;font-family:var(--f-titre)}
.qs>li{margin:10px 0}.q{font-weight:700;margin-bottom:4px}
.opts{list-style:none;padding:0;display:grid;gap:2px}.opts li{padding-left:1.4em;position:relative}
.opts li::before{content:"○";position:absolute;left:0;color:var(--encre-2)}
.opts li.bonne{color:var(--rouge);font-weight:700}.opts li.bonne::before{content:"●";color:var(--rouge)}
mark{background:var(--surligne);color:var(--rouge);font-weight:700;padding:0 4px;border-radius:3px}
.expl{font-size:.9rem;color:var(--encre-2)}
.avis{margin-top:12px;padding-top:8px;border-top:1px dashed var(--trait);font-size:.875rem;color:var(--encre-2)}
.niv,.comp{display:inline-block;font-size:.75rem;font-weight:700;padding:0 7px;border-radius:999px;line-height:1.6}
.niv{border:1px solid var(--trait)}.comp{color:#fff}
.c-CO{background:var(--CO)}.c-CE{background:var(--CE)}.c-PE{background:var(--PE)}.c-PO{background:var(--PO)}.c-LS{background:var(--LS)}
.tab{overflow-x:auto;margin:10px 0}table{border-collapse:collapse;width:100%;font-size:.9rem}th,td{text-align:left;vertical-align:top;padding:6px 8px;border-bottom:1px solid var(--trait)}th{color:var(--encre-2);font-weight:700}
.deux,.trois,.quatre{display:grid;gap:12px}.deux{grid-template-columns:repeat(auto-fit,minmax(240px,1fr))}.trois{grid-template-columns:repeat(auto-fit,minmax(200px,1fr))}.quatre{grid-template-columns:repeat(auto-fit,minmax(180px,1fr))}
.deux>*,.trois>*,.quatre>*{min-width:0}
.note{font-size:.875rem;color:var(--encre-2);border:1px solid var(--trait);border-radius:8px;padding:10px 12px}
</style>
<div class="page">
<h1>Cahier de relecture — Tremplin FLE</h1>
<p class="chapeau">Tout le contenu pédagogique de l’application, tel que l’élève le voit, avec les réponses attendues en rouge. Version du ${date}. Pour signaler une correction, commentez l’élément concerné ou citez sa référence (en petits caractères au-dessus de chaque titre).</p>
<div class="mode">
<div><span class="chiffre">${EXAMENS.length}</span><br>fiches d’examen</div>
<div><span class="chiffre">${NIVEAUX_CECRL.reduce((s, n) => s + n.fiches.length, 0)}</span><br>fiches pédagogiques (A1 à C2)</div>
<div><span class="chiffre">${ACTIVITES.length}</span><br>activités · ${nbQ} items à vérifier</div>
</div>
<p class="note"><b>Ce qu’il faut vérifier.</b> Exactitude des formats d’examen (durées, barèmes) ; niveau réel de chaque texte et de chaque question ; une seule bonne réponse par question et des distracteurs plausibles ; explications justes ; respect de la typographie. ${typo(AVERTISSEMENT_EXAMENS)}</p>
<nav class="sommaire" aria-label="Sommaire"><a href="#examens">Examens</a>${NIVEAUX_CECRL.map((n) => `<a href="#niveau-${n.niveau}">Fiches ${n.niveau}</a>`).join("")}${NIVEAUX_CECRL.map((n) => `<a href="#act-${n.niveau}">Activités ${n.niveau}</a>`).join("")}</nav>
<h2 id="examens">1. Les examens</h2>${examens}
<h2 id="fiches">2. Niveaux et fiches pédagogiques</h2>${niveaux}
<h2 id="activites">3. Banque d’activités</h2>${parNiveau}
</div>`;

writeFileSync(sortie, html);
console.log(`Écrit : ${sortie} (${Math.round(html.length / 1024)} Ko)`);
