import type { Competence, Tentative } from "./types";

/**
 * Typographie française à l’affichage : espace fine insécable avant ; ! ? et
 * espace insécable avant : et à l’intérieur des guillemets « ».
 * Les contenus sont saisis avec des espaces ordinaires ; on les remplace ici.
 */
export function typo(t: string): string {
  return t
    .replace(/ ([;!?])/g, " $1")
    .replace(/ :(\s|$)/g, " :$1")
    .replace(/« /g, "« ")
    .replace(/ »/g, " »");
}

const sansAccents = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "");

/** Normalise une réponse : casse, apostrophes, espaces. Les accents restent significatifs. */
export function normaliser(s: string): string {
  return s.trim().toLowerCase().replace(/['`´]/g, "’").replace(/\s+/g, " ").replace(/[.!?]$/, "");
}

export type Verdict = "juste" | "accents" | "faux";

export function verifier(saisie: string, attendues: string[]): Verdict {
  const n = normaliser(saisie);
  if (!n) return "faux";
  if (attendues.some((a) => normaliser(a) === n)) return "juste";
  if (attendues.some((a) => sansAccents(normaliser(a)) === sansAccents(n))) return "accents";
  return "faux";
}

export function compterMots(t: string): number {
  // Règle des consignes du DELF : est un mot tout ensemble de signes placé entre deux espaces
  // (« c’est-à-dire » = 1 mot ; « je ne l’ai pas vu » = 5 mots).
  return t.split(/\s+/).filter((m) => /[\p{L}\p{N}]/u.test(m)).length;
}

/** Mélange déterministe (même ordre pour une même graine). */
export function melanger<T>(tab: T[], graine: string): T[] {
  let h = 2166136261;
  for (const c of graine) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  const r = [...tab];
  for (let i = r.length - 1; i > 0; i--) {
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    const j = Math.abs(h) % (i + 1);
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
}

export interface StatCompetence {
  competence: Competence;
  nb: number;
  moyenne: number; // 0..1
  tendance: number; // différence entre les 3 dernières et les 3 précédentes
}

export function statistiques(ts: Tentative[]): StatCompetence[] {
  const par = new Map<Competence, Tentative[]>();
  for (const t of ts) par.set(t.competence, [...(par.get(t.competence) ?? []), t]);
  return [...par.entries()].map(([competence, liste]) => {
    const tri = [...liste].sort((a, b) => b.faiteLe.localeCompare(a.faiteLe));
    const taux = (x: Tentative) => (x.noteProf != null && x.max ? x.noteProf / 20 : x.score / x.max);
    const moy = (l: Tentative[]) => (l.length ? l.reduce((s, x) => s + taux(x), 0) / l.length : 0);
    const recent = tri.slice(0, 3);
    const avant = tri.slice(3, 6);
    return { competence, nb: liste.length, moyenne: moy(liste), tendance: avant.length ? moy(recent) - moy(avant) : 0 };
  });
}

export const pct = (x: number) => `${Math.round(x * 100)} %`;

export function dateFr(iso: string, avecHeure = false): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    ...(avecHeure ? { hour: "2-digit", minute: "2-digit" } : {}),
  });
}
