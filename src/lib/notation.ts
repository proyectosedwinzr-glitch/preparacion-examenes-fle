import type { ExamenBlanc, EpreuveBlanche } from "../data/examensBlancs";
import type { Tentative } from "./types";

export interface NoteEpreuve {
  epreuve: EpreuveBlanche;
  /** Note sur 25, ou null si l’épreuve n’est pas terminée. */
  note: number | null;
  faites: number;
  /** Une note du professeur a remplacé l’auto-évaluation ou la note de l’IA. */
  corrigeeParProf: boolean;
}

export interface NoteExamen {
  epreuves: NoteEpreuve[];
  total: number | null;
  reussi: boolean | null;
}

/** Taux de réussite d’une tentative ; la note du professeur (sur 20) prime. */
const taux = (t: Tentative) => (t.noteProf != null ? t.noteProf / 20 : t.max ? t.score / t.max : 0);

/**
 * Notation façon DELF : chaque épreuve sur 25 (moyenne des dernières tentatives de ses activités),
 * total sur 100, réussite avec 50/100 et au moins 5/25 dans chaque épreuve.
 */
export function noterExamen(eb: ExamenBlanc, tentatives: Tentative[]): NoteExamen {
  const derniere = new Map<string, Tentative>();
  for (const t of [...tentatives].sort((a, b) => a.faiteLe.localeCompare(b.faiteLe))) derniere.set(t.activiteId, t);

  const epreuves = eb.epreuves.map((ep) => {
    const ts = ep.activites.map((id) => derniere.get(id)).filter((t): t is Tentative => !!t);
    const complete = ts.length === ep.activites.length;
    const moyenne = ts.reduce((s, t) => s + taux(t), 0) / (ts.length || 1);
    return {
      epreuve: ep,
      note: complete ? Math.round(moyenne * 25 * 2) / 2 : null,
      faites: ts.length,
      corrigeeParProf: ts.some((t) => t.noteProf != null),
    };
  });
  const toutes = epreuves.every((e) => e.note !== null);
  const total = toutes ? epreuves.reduce((s, e) => s + (e.note ?? 0), 0) : null;
  return { epreuves, total, reussi: total === null ? null : total >= 50 && epreuves.every((e) => (e.note ?? 0) >= 5) };
}
