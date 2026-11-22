import type { Competence, Tentative } from "./types";

/** Identifiant des résultats du test de niveau (exclus des statistiques par compétence). */
export const TEST_NIVEAU_ID = "test-niveau";

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

/** Taux de réussite d’une tentative ; la note du professeur (sur 20) prime. */
export const taux = (t: Tentative) => (t.noteProf != null ? t.noteProf / 20 : t.max ? t.score / t.max : 0);

export interface StatCompetence {
  competence: Competence;
  nb: number;
  moyenne: number; // 0..1
  tendance: number; // différence entre les 3 dernières et les 3 précédentes
}

export function statistiques(ts: Tentative[]): StatCompetence[] {
  const par = new Map<Competence, Tentative[]>();
  for (const t of ts) if (t.activiteId !== TEST_NIVEAU_ID) par.set(t.competence, [...(par.get(t.competence) ?? []), t]);
  return [...par.entries()].map(([competence, liste]) => {
    const tri = [...liste].sort((a, b) => b.faiteLe.localeCompare(a.faiteLe));
    const moy = (l: Tentative[]) => (l.length ? l.reduce((s, x) => s + taux(x), 0) / l.length : 0);
    const recent = tri.slice(0, 3);
    const avant = tri.slice(3, 6);
    return { competence, nb: liste.length, moyenne: moy(liste), tendance: avant.length ? moy(recent) - moy(avant) : 0 };
  });
}

export const pct = (x: number) => `${Math.round(x * 100)} %`;

export function dateFr(iso: string, avecHeure = false): string {
  const d = /^\d{4}-\d{2}-\d{2}$/.test(iso) ? new Date(iso + "T00:00:00") : new Date(iso);
  return d.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    ...(avecHeure ? { hour: "2-digit", minute: "2-digit" } : {}),
  });
}

const deux = (n: number) => String(n).padStart(2, "0");

/** Date du jour au format AAAA-MM-JJ, dans le fuseau de l’appareil. */
export function jourLocal(d = new Date()): string {
  return `${d.getFullYear()}-${deux(d.getMonth() + 1)}-${deux(d.getDate())}`;
}

/** Nombre de jours entre aujourd’hui et une date AAAA-MM-JJ (négatif si elle est passée). */
export function joursAvant(date: string): number {
  const cible = new Date(date + "T00:00:00").getTime();
  const auj = new Date(jourLocal() + "T00:00:00").getTime();
  return Math.round((cible - auj) / 86400000);
}

/** Jours consécutifs avec au moins une activité, jusqu’à aujourd’hui (ou hier si rien n’est encore fait aujourd’hui). */
export function serieJours(ts: Tentative[]): number {
  const jours = new Set(ts.map((t) => jourLocal(new Date(t.faiteLe))));
  const d = new Date();
  if (!jours.has(jourLocal(d))) d.setDate(d.getDate() - 1);
  let n = 0;
  while (jours.has(jourLocal(d))) {
    n++;
    d.setDate(d.getDate() - 1);
  }
  return n;
}

/** Propose un fichier JSON au téléchargement. */
export function telechargerJson(nom: string, donnees: unknown) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(donnees, null, 2)], { type: "application/json" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = nom;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Copie un texte dans le presse-papiers ; renvoie false si le navigateur refuse. */
export async function copier(texte: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(texte);
    return true;
  } catch {
    return false;
  }
}
