import { useEffect, useRef, useState } from "react";
import type { Niveau } from "../lib/types";
import { debitNiveau, definirVitesse, lire, syntheseDisponible, useVoixFr, vitesse } from "../lib/voix";

const VITESSES = [
  { v: 0.8, label: "Lente" },
  { v: 0.9, label: "Un peu lente" },
  { v: 1, label: "Normale" },
  { v: 1.1, label: "Rapide" },
];

/**
 * Lecteur d’un document sonore, avec un nombre d’écoutes limité comme à l’examen.
 * Joue l’enregistrement réel s’il existe (`fichier`), sinon la voix de synthèse, une voix par locuteur.
 */
export default function Lecteur({ texte, ecoutesMax, niveau, fichier }: { texte: string; ecoutesMax: number; niveau: Niveau; fichier?: string }) {
  const voix = useVoixFr();
  const [ecoutes, setEcoutes] = useState(0);
  const [enCours, setEnCours] = useState(false);
  const [v, setV] = useState(vitesse());
  const arret = useRef<() => void>(() => {});
  const audio = useRef<HTMLAudioElement | null>(null);
  useEffect(
    () => () => {
      arret.current();
      audio.current?.pause();
    },
    [],
  );

  const fini = ecoutes >= ecoutesMax;
  function jouer() {
    if (fini || enCours) return;
    setEcoutes((x) => x + 1);
    setEnCours(true);
    if (fichier) {
      const a = audio.current ?? new Audio(fichier);
      audio.current = a;
      a.playbackRate = v;
      a.currentTime = 0;
      a.onended = () => setEnCours(false);
      a.onerror = () => setEnCours(false);
      a.play().catch(() => setEnCours(false));
      return;
    }
    arret.current = lire(texte, { debit: debitNiveau(niveau), voix, onFin: () => setEnCours(false) });
  }
  function arreter() {
    arret.current();
    audio.current?.pause();
    setEnCours(false);
  }

  if (!fichier && !syntheseDisponible())
    return <p className="erreur">Votre navigateur ne lit pas la voix de synthèse. Essayez Chrome, Edge ou Safari dans une version récente.</p>;
  return (
    <div className="lecteur">
      <button className="btn" onClick={jouer} disabled={enCours || fini}>
        {enCours ? "Écoute en cours…" : ecoutes === 0 ? "▶ Écouter" : "▶ Réécouter"}
      </button>
      {enCours && <button className="btn secondaire petit-btn" onClick={arreter}>■ Arrêter</button>}
      <span className="petit" aria-live="polite">Écoutes : {ecoutes} / {ecoutesMax}</span>
      <label className="petit vitesse">
        Vitesse
        <select value={v} onChange={(e) => { const n = Number(e.target.value); setV(n); definirVitesse(n); }}>
          {VITESSES.map((x) => <option key={x.v} value={x.v}>{x.label}</option>)}
        </select>
      </label>
      {!fichier && (
        <span className="petit">
          {voix.length ? `Voix de synthèse (${voix.length} voix française${voix.length > 1 ? "s" : ""} sur cet appareil).` : "Aucune voix française détectée sur cet appareil : la lecture peut être approximative."}
        </span>
      )}
    </div>
  );
}

/** Petit bouton pour entendre un mot, une phrase ou un texte modèle. */
export function BoutonEcoute({ texte, label = "Écouter" }: { texte: string; label?: string }) {
  const voix = useVoixFr();
  if (!syntheseDisponible()) return null;
  return (
    <button type="button" className="bouton-ecoute" title={label} aria-label={`${label} : ${texte.slice(0, 60)}`} onClick={() => lire(texte, { debit: 0.9, voix })}>
      🔊
    </button>
  );
}
