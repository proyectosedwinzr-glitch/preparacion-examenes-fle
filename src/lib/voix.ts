import { useEffect, useState } from "react";
import type { Niveau } from "./types";

/** Synthèse vocale : voix françaises, vitesse réglable, dialogues à plusieurs voix. */

const CLE_VITESSE = "tremplin-vitesse";

export function vitesse(): number {
  try {
    return Number(localStorage.getItem(CLE_VITESSE)) || 1;
  } catch {
    return 1;
  }
}

export function definirVitesse(v: number) {
  try {
    localStorage.setItem(CLE_VITESSE, String(v));
  } catch {
    /* stockage indisponible : la vitesse reste celle de la page */
  }
}

export const syntheseDisponible = () => typeof window !== "undefined" && "speechSynthesis" in window;

/** Voix françaises de l’appareil, celles de France en premier. */
export function useVoixFr(): SpeechSynthesisVoice[] {
  const [voix, setVoix] = useState<SpeechSynthesisVoice[]>([]);
  useEffect(() => {
    if (!syntheseDisponible()) return;
    const choisir = () =>
      setVoix(
        speechSynthesis
          .getVoices()
          .filter((v) => v.lang.toLowerCase().startsWith("fr"))
          .sort((a, b) => Number(b.lang === "fr-FR") - Number(a.lang === "fr-FR")),
      );
    choisir();
    speechSynthesis.addEventListener("voiceschanged", choisir);
    return () => speechSynthesis.removeEventListener("voiceschanged", choisir);
  }, []);
  return voix;
}

export interface Replique {
  locuteur?: string;
  texte: string;
}

/** Découpe un script : chaque ligne « Nom : texte » est une réplique ; les autres lignes sont lues telles quelles. */
export function decouper(contenu: string): Replique[] {
  return contenu
    .split(/\n+/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const m = /^([A-ZÀ-ÖØ-Þ][\p{L}’' -]{0,28}) : (.+)$/u.exec(l);
      return m ? { locuteur: m[1], texte: m[2] } : { texte: l };
    });
}

/** Phrases courtes : certains navigateurs coupent les énoncés trop longs. */
const phrases = (t: string) => t.match(/[^.!?…]+[.!?…»]*\s*/g)?.map((s) => s.trim()).filter(Boolean) ?? [t];

export const debitNiveau = (n: Niveau) => (n === "A1" || n === "A2" ? 0.85 : n === "B1" ? 0.95 : 1);

/**
 * Lit un texte ou un dialogue. Chaque locuteur reçoit sa propre voix ; avec une seule voix
 * sur l’appareil, on change la hauteur pour les distinguer. Renvoie une fonction d’arrêt.
 */
export function lire(contenu: string, o: { debit: number; voix: SpeechSynthesisVoice[]; onFin?: () => void }): () => void {
  if (!syntheseDisponible()) {
    o.onFin?.();
    return () => {};
  }
  speechSynthesis.cancel();
  const repliques = decouper(contenu);
  const locuteurs = [...new Set(repliques.map((r) => r.locuteur).filter(Boolean))] as string[];
  const enonces: SpeechSynthesisUtterance[] = [];
  for (const r of repliques) {
    const i = r.locuteur ? locuteurs.indexOf(r.locuteur) : 0;
    for (const p of phrases(r.texte)) {
      const u = new SpeechSynthesisUtterance(p);
      u.lang = "fr-FR";
      if (o.voix.length) u.voice = o.voix[i % o.voix.length];
      if (o.voix.length < 2 && locuteurs.length > 1) u.pitch = [1, 0.7, 1.3][i % 3];
      u.rate = Math.min(1.5, Math.max(0.5, o.debit * vitesse()));
      enonces.push(u);
    }
  }
  if (!enonces.length) {
    o.onFin?.();
    return () => {};
  }
  const dernier = enonces[enonces.length - 1];
  dernier.onend = () => o.onFin?.();
  dernier.onerror = () => o.onFin?.();
  enonces.forEach((u) => speechSynthesis.speak(u));
  return () => speechSynthesis.cancel();
}
