import { toutesFiches } from "../data/levels.ts";
import { THEMES } from "../data/themes.ts";
import type { Niveau } from "./types.ts";

/** Recherche plein texte dans les fiches et les révisions : réponse de secours du tuteur, sans IA. */

const VIDES = new Set(
  "les des une un le la de du et ou en au aux est sont pour par sur dans avec que qui quoi quel quelle quels quelles comment pourquoi quand difference entre faut faire peux peut veux explique expliquer expliquez moi mon ma mes ton ta tes son sa ses cette ces c est il elle on nous vous ils elles je tu me te se ne pas plus tres bien donne donner donnez exemple exemples utiliser utilise emploie employer dire quoi aide aider question".split(" "),
);

const norm = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[’']/g, " ").replace(/[^a-z0-9 ]/g, " ");

export interface Resultat {
  titre: string;
  href: string;
  extrait: string;
  score: number;
}

export function rechercher(question: string, niveau?: Niveau): Resultat[] {
  const mots = [...new Set(norm(question).split(/\s+/).filter((m) => m.length > 2 && !VIDES.has(m)))];
  if (!mots.length) return [];
  const score = (champs: [string, number][]) => mots.reduce((s, m) => s + champs.reduce((x, [txt, poids]) => x + (txt.includes(m) ? poids : 0), 0), 0);
  const res: Resultat[] = [];
  for (const f of toutesFiches()) {
    const s = score([[norm(f.titre), 4], [norm(f.objectif), 2], [norm(f.explication.join(" ") + " " + f.aRetenir.join(" ")), 1]]);
    if (s > 0) res.push({ titre: `Fiche ${f.niveau} : ${f.titre}`, href: `#/fiche/${f.id}`, extrait: f.aRetenir.join(" "), score: s + (f.niveau === niveau ? 1 : 0) });
  }
  for (const t of THEMES) {
    const s = score([[norm(t.theme), 4], [norm(t.resume), 2], [norm(t.lexique.map((e) => `${e.mot} ${e.indice}`).join(" ")), 1]]);
    if (s > 0) res.push({ titre: `Lexique ${t.niveau} : ${t.theme}`, href: `#/revisions/${t.id}`, extrait: t.resume, score: s + (t.niveau === niveau ? 1 : 0) });
  }
  return res.sort((a, b) => b.score - a.score).slice(0, 3);
}

export function reponseLocale(question: string, niveau?: Niveau): { texte: string; liens: { label: string; href: string }[] } {
  const r = rechercher(question, niveau);
  if (!r.length)
    return {
      texte:
        "Je n’ai pas trouvé de fiche sur ce point. Essayez avec un mot-clé (« subjonctif », « passé composé », « lettre formelle », « synthèse »…) ou posez la question à votre professeur depuis « Mon professeur ».",
      liens: [],
    };
  return {
    texte: `Voici ce que disent les fiches de Tremplin :\n\n${r.map((x) => `${x.titre}\n${x.extrait}`).join("\n\n")}`,
    liens: r.map((x) => ({ label: x.titre, href: x.href })),
  };
}
