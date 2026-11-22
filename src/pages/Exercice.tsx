import { useEffect, useMemo, useState } from "react";
import { ACTIVITES, activite, type Activite, type ItemQCM } from "../data/activities";
import { EXAMENS } from "../data/exams";
import { backend } from "../lib/instance";
import { useProfil, useRoute } from "../lib/hooks";
import { corriger, corrigerOral } from "../lib/ai";
import type { CorrectionIA } from "../lib/types";
import { compterMots, melanger, typo, verifier, type Verdict } from "../lib/util";
import { Badge, BadgeComp, Paragraphes, T } from "../components/ui";
import CorrectionVue from "../components/CorrectionVue";
import Lecteur from "../components/Lecteur";
import Assigner from "../components/Assigner";

type Enregistrer = (score: number, max: number, extra?: { reponses?: Record<string, string>; production?: string; correction?: CorrectionIA }) => Promise<void>;

const nomsExamens = (a: Activite) => a.examens.map((e) => EXAMENS.find((x) => x.id === e)?.nom).join(", ");

export default function Exercice({ id }: { id: string }) {
  const a = activite(id);
  const { profil } = useProfil();
  const { params } = useRoute();
  const devoirId = params.get("devoir") ?? undefined;
  const eb = params.get("eb");
  const [enregistre, setEnregistre] = useState<{ ok: boolean; t: string }>();
  const [assigner, setAssigner] = useState(false);

  if (!a) return <p>Activité introuvable. <a href="#/activites">Retour</a></p>;
  const apercu = profil.role === "professeur";
  const position = ACTIVITES.indexOf(a);
  const suivante = eb ? undefined : ACTIVITES.find((x, i) => i > position && x.niveau === a.niveau && x.competence === a.competence && !x.id.startsWith("eb-"));

  const enregistrer: Enregistrer = async (score, max, extra) => {
    if (apercu) return setEnregistre({ ok: true, t: "Aperçu professeur : le résultat n’est pas enregistré." });
    try {
      await backend.enregistrerTentative({
        activiteId: a.id, titre: a.titre, niveau: a.niveau, competence: a.competence, examens: a.examens,
        score, max, devoirId, ...extra,
      });
      setEnregistre({ ok: true, t: devoirId ? "Résultat enregistré et devoir rendu à votre professeur." : "Résultat enregistré dans vos progrès." });
    } catch (e) {
      setEnregistre({ ok: false, t: (e as Error).message });
    }
  };

  return (
    <article className="pile exercice">
      {eb ? <a href={`#/examens-blancs/${eb}`} className="retour">← Retour à l’examen blanc</a> : <a href="#/activites" className="retour">← Activités</a>}
      <header>
        <div className="badges">
          <Badge>{a.niveau}</Badge> <BadgeComp c={a.competence} /> <span className="petit">{a.theme} · environ {a.duree} min</span>
        </div>
        <div className="titre-ligne">
          <h1><T>{a.titre}</T></h1>
          {apercu && <button className="btn" onClick={() => setAssigner(true)}>Assigner à un élève</button>}
        </div>
        <p className="petit">Examens : {nomsExamens(a)}</p>
        {apercu && <p className="note">Aperçu professeur : vous pouvez faire l’activité, rien n’est enregistré.</p>}
        {devoirId && <p className="note">Devoir de votre professeur.</p>}
        <p className="consigne"><T>{a.consigne}</T></p>
      </header>
      {a.type === "qcm" && <QCM a={a} enregistrer={enregistrer} />}
      {a.type === "trous" && <Trous a={a} enregistrer={enregistrer} />}
      {a.type === "production" && <Production a={a} enregistrer={enregistrer} />}
      {a.type === "oral" && <Oral a={a} enregistrer={enregistrer} />}
      {enregistre && (
        <p className={enregistre.ok ? "succes" : "erreur"} role="status">
          {enregistre.t}
          {enregistre.ok && suivante && <> <a href={`#/activite/${suivante.id}`}>Activité suivante : {suivante.titre} →</a></>}
          {!enregistre.ok && <> <a href="#/compte">Mon compte</a></>}
        </p>
      )}
      {assigner && <Assigner activiteId={a.id} fermer={() => setAssigner(false)} />}
    </article>
  );
}

function Documents({ docs }: { docs?: { titre: string; texte: string }[] }) {
  if (!docs?.length) return null;
  return (
    <div className="grille-2">
      {docs.map((d) => (
        <section key={d.titre} className="carte document"><h2><T>{d.titre}</T></h2><p><T>{d.texte}</T></p></section>
      ))}
    </div>
  );
}

// ───────────────────────── QCM ─────────────────────────

function QCM({ a, enregistrer }: { a: Extract<Activite, { type: "qcm" }>; enregistrer: Enregistrer }) {
  const items = useMemo(() => a.items.map((it, i) => ({ ...it, ordre: melanger(it.options.map((_, k) => k), `${a.id}-${i}`) })), [a]);
  const [rep, setRep] = useState<Record<number, number>>({});
  const [valide, setValide] = useState(false);
  const score = items.filter((it, i) => rep[i] === it.bonne).length;
  const toutRepondu = Object.keys(rep).length === items.length;

  function valider() {
    setValide(true);
    const reponses: Record<string, string> = {};
    items.forEach((it: ItemQCM, i) => (reponses[`Q${i + 1}`] = rep[i] === undefined ? "(sans réponse)" : it.options[rep[i]]));
    enregistrer(score, items.length, { reponses });
  }

  return (
    <>
      {a.support?.nature === "texte" && (
        <section className="carte document">
          <h2>{a.support.titre}</h2>
          <Paragraphes texte={a.support.contenu} />
        </section>
      )}
      {a.support?.nature === "audio" && (
        <section className="carte">
          <h2>{a.support.titre}</h2>
          <p className="petit">Lisez d’abord les questions, puis lancez l’écoute.</p>
          <Lecteur texte={a.support.contenu} ecoutesMax={a.support.ecoutesMax ?? 2} niveau={a.niveau} fichier={a.support.fichierAudio} />
        </section>
      )}
      <ol className="questions">
        {items.map((it, i) => (
          <li key={i} className="carte question">
            <p className="q"><T>{it.q}</T></p>
            <div className="options" role="radiogroup" aria-label={`Question ${i + 1}`}>
              {it.ordre.map((k) => {
                const etat = !valide ? "" : k === it.bonne ? "juste" : rep[i] === k ? "faux" : "";
                return (
                  <label key={k} className={`option ${rep[i] === k ? "choisie" : ""} ${etat}`}>
                    <input type="radio" name={`q${i}`} disabled={valide} checked={rep[i] === k} onChange={() => setRep({ ...rep, [i]: k })} />
                    <T>{it.options[k]}</T>
                  </label>
                );
              })}
            </div>
            {valide && <p className={`explication ${rep[i] === it.bonne ? "ok" : "ko"}`}>{rep[i] === it.bonne ? "✓ " : "✗ "}<T>{it.explication}</T></p>}
          </li>
        ))}
      </ol>
      {!valide ? (
        <button className="btn" onClick={valider} disabled={!toutRepondu}>
          {toutRepondu ? "Valider mes réponses" : `Répondez à toutes les questions (${Object.keys(rep).length}/${items.length})`}
        </button>
      ) : (
        <section className="carte resultat">
          <h2>Résultat : {score} / {items.length}</h2>
          {a.support?.nature === "audio" && (
            <details open>
              <summary>Transcription</summary>
              <Paragraphes texte={a.support.contenu} />
            </details>
          )}
          <button className="btn secondaire" onClick={() => { setRep({}); setValide(false); }}>Recommencer</button>
        </section>
      )}
    </>
  );
}

// ───────────────────────── Texte à trous ─────────────────────────

function Trous({ a, enregistrer }: { a: Extract<Activite, { type: "trous" }>; enregistrer: Enregistrer }) {
  const [rep, setRep] = useState<string[]>(a.phrases.map(() => ""));
  const [verdicts, setVerdicts] = useState<Verdict[] | null>(null);

  function valider() {
    const v = a.phrases.map((p, i) => verifier(rep[i], p.reponses));
    setVerdicts(v);
    const reponses: Record<string, string> = {};
    a.phrases.forEach((_, i) => (reponses[`${i + 1}`] = rep[i] || "(vide)"));
    enregistrer(v.filter((x) => x === "juste").length, a.phrases.length, { reponses });
  }

  return (
    <>
      <ol className="questions">
        {a.phrases.map((p, i) => {
          const [avant, apres] = p.texte.split("___");
          const v = verdicts?.[i];
          return (
            <li key={i} className="carte question">
              <p className="trou-ligne">
                <T>{avant}</T>
                <input
                  aria-label={`Réponse ${i + 1}`}
                  className={`trou ${v ?? ""}`}
                  value={rep[i]}
                  disabled={!!verdicts}
                  onChange={(e) => setRep(rep.map((x, j) => (j === i ? e.target.value : x)))}
                  size={Math.max(8, p.reponses[0].length + 2)}
                  autoCapitalize="off" autoCorrect="off" spellCheck={false}
                />
                <T>{apres ?? ""}</T>
              </p>
              {v && (
                <p className={`explication ${v === "juste" ? "ok" : "ko"}`}>
                  {v === "juste" ? "✓ " : v === "accents" ? "≈ Presque : vérifiez les accents. " : "✗ "}
                  {v !== "juste" && <>Réponse attendue : <b>{p.reponses[0]}</b>. </>}
                  <T>{p.explication}</T>
                </p>
              )}
            </li>
          );
        })}
      </ol>
      <ClavierAccents />
      {!verdicts ? (
        <button className="btn" onClick={valider}>Valider</button>
      ) : (
        <section className="carte resultat">
          <h2>Résultat : {verdicts.filter((x) => x === "juste").length} / {a.phrases.length}</h2>
          <button className="btn secondaire" onClick={() => { setRep(a.phrases.map(() => "")); setVerdicts(null); }}>Recommencer</button>
        </section>
      )}
    </>
  );
}

/** Insère un caractère accentué dans le champ actif (utile sur les claviers non français). */
function ClavierAccents() {
  const lettres = ["é", "è", "ê", "à", "â", "ç", "ù", "û", "î", "ï", "ô", "œ", "’", "« ", " »"];
  return (
    <div className="clavier" aria-label="Caractères français">
      {lettres.map((l) => (
        <button key={l} type="button" className="touche" onMouseDown={(e) => {
          e.preventDefault();
          const el = document.activeElement as HTMLInputElement | HTMLTextAreaElement | null;
          if (!el || !("setRangeText" in el)) return;
          el.setRangeText(l, el.selectionStart ?? el.value.length, el.selectionEnd ?? el.value.length, "end");
          el.dispatchEvent(new Event("input", { bubbles: true }));
        }}>{l.trim()}</button>
      ))}
    </div>
  );
}

// ───────────────────────── Production écrite ─────────────────────────

function lireBrouillon(cle: string) {
  try {
    return localStorage.getItem(cle) ?? "";
  } catch {
    return "";
  }
}

function Production({ a, enregistrer }: { a: Extract<Activite, { type: "production" }>; enregistrer: Enregistrer }) {
  const { profil } = useProfil();
  const cle = `tremplin-brouillon-${a.id}`;
  const [texte, setTexte] = useState(() => lireBrouillon(cle));
  const [etat, setEtat] = useState<"redaction" | "correction" | "corrige">("redaction");
  const [correction, setCorrection] = useState<CorrectionIA>();
  const [erreur, setErreur] = useState("");
  const mots = compterMots(texte);
  useEffect(() => {
    try {
      localStorage.setItem(cle, texte);
    } catch {
      /* stockage indisponible : pas de brouillon */
    }
  }, [cle, texte]);

  async function envoyer() {
    setErreur("");
    setEtat("correction");
    try {
      const c = await corriger({ consigne: a.consigne, texte, niveau: a.niveau, motsMin: a.motsMin, examen: nomsExamens(a), langue: profil.langueIA });
      setCorrection(c);
      setEtat("corrige");
      try {
        localStorage.removeItem(cle);
      } catch {
        /* idem */
      }
      await enregistrer(Math.round(c.note * 10) / 10, 20, { production: texte, correction: c });
    } catch (e) {
      setErreur((e as Error).message);
      setEtat("redaction");
    }
  }

  return (
    <>
      <Documents docs={a.documents} />
      <details className="carte">
        <summary>Critères d’évaluation</summary>
        <ul>{a.grille.map((g) => <li key={g}><T>{g}</T></li>)}</ul>
      </details>
      <section className="carte">
        <label className="champ">Votre texte
          <textarea rows={14} value={texte} disabled={etat !== "redaction"} onChange={(e) => setTexte(e.target.value)} spellCheck={false} lang="fr" />
        </label>
        <div className="compteur">
          <span className={mots < a.motsMin ? "attention" : "ok"}>{mots} mots</span>
          <span className="petit"> · minimum {a.motsMin}{a.motsMax ? ` · maximum conseillé ${a.motsMax}` : ""}</span>
          <span className="petit"> · brouillon enregistré automatiquement</span>
        </div>
        {etat === "redaction" && <ClavierAccents />}
        <p className="petit">Le correcteur orthographique du navigateur est désactivé, comme le jour de l’examen.</p>
        {erreur && <p className="erreur" role="alert">{erreur}</p>}
        {etat !== "corrige" && (
          <button className="btn" disabled={mots < Math.min(20, a.motsMin) || etat === "correction"} onClick={envoyer}>
            {etat === "correction" ? "Correction en cours…" : "Envoyer à la correction IA"}
          </button>
        )}
      </section>
      {correction && <CorrectionVue c={correction} />}
      {etat === "corrige" && <button className="btn secondaire" onClick={() => { setTexte(""); setCorrection(undefined); setEtat("redaction"); }}>Nouvelle rédaction</button>}
    </>
  );
}

// ───────────────────────── Tâche orale ─────────────────────────

/**
 * Chronomètre. Avec `cle`, l’état est gardé pendant la session du navigateur :
 * le temps continue de s’écouler quand l’élève ouvre un document puis revient.
 */
export function Chrono({ minutes, label, cle }: { minutes: number; label: string; cle?: string }) {
  type Etat = { fin?: number; reste: number };
  const lire = (): Etat => {
    try { const v = cle && sessionStorage.getItem("chrono-" + cle); if (v) return JSON.parse(v); } catch { /* stockage indisponible */ }
    return { reste: minutes * 60 };
  };
  const [etat, setEtat] = useState<Etat>(lire);
  const [, setTic] = useState(0);
  const actif = etat.fin !== undefined;
  const reste = actif ? Math.max(0, Math.round((etat.fin! - Date.now()) / 1000)) : etat.reste;
  const changer = (e: Etat) => {
    setEtat(e);
    try { if (cle) sessionStorage.setItem("chrono-" + cle, JSON.stringify(e)); } catch { /* idem */ }
  };
  useEffect(() => {
    if (!actif) return;
    if (reste <= 0) { changer({ reste: 0 }); return; }
    const t = setTimeout(() => setTic((x) => x + 1), 500);
    return () => clearTimeout(t);
  });
  const mm = String(Math.floor(reste / 60)).padStart(2, "0");
  const ss = String(reste % 60).padStart(2, "0");
  return (
    <div className="chrono">
      <span className="petit">{label}</span>
      <span className={`chrono-temps ${reste < 60 ? "attention" : ""}`} role="timer">{reste === 0 ? "Temps écoulé" : `${mm}:${ss}`}</span>
      <button className="btn secondaire petit-btn" disabled={reste === 0}
        onClick={() => changer(actif ? { reste } : { fin: Date.now() + reste * 1000, reste })}>
        {actif ? "Pause" : reste === minutes * 60 ? "Démarrer" : "Reprendre"}
      </button>
      <button className="btn-lien" onClick={() => changer({ reste: minutes * 60 })}>Réinitialiser</button>
    </div>
  );
}

/** Reconnaissance vocale du navigateur (Chrome, Edge, Safari) : sert à transcrire la prise de parole. */
interface Reconnaissance {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  onresult: ((e: { resultIndex: number; results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }> }) => void) | null;
  onend: (() => void) | null;
  onerror: ((e: { error: string }) => void) | null;
}
type ConstructeurReco = new () => Reconnaissance;
const fenetre = window as unknown as Record<string, ConstructeurReco | undefined>;
const Reco = fenetre.SpeechRecognition ?? fenetre.webkitSpeechRecognition;

function Oral({ a, enregistrer }: { a: Extract<Activite, { type: "oral" }>; enregistrer: Enregistrer }) {
  const { profil } = useProfil();
  const [coches, setCoches] = useState<boolean[]>(a.points.map(() => false));
  const [audio, setAudio] = useState<string>();
  const [enreg, setEnreg] = useState<MediaRecorder | null>(null);
  const [erreurMicro, setErreurMicro] = useState("");
  const [transcription, setTranscription] = useState("");
  const [dictee, setDictee] = useState<{ stop: () => void } | null>(null);
  const [correction, setCorrection] = useState<CorrectionIA>();
  const [attenteIA, setAttenteIA] = useState(false);
  const [erreurIA, setErreurIA] = useState("");
  const [fini, setFini] = useState(false);
  const mots = compterMots(transcription);
  useEffect(() => () => dictee?.stop(), [dictee]);

  async function demarrer() {
    setErreurMicro("");
    try {
      const flux = await navigator.mediaDevices.getUserMedia({ audio: true });
      const r = new MediaRecorder(flux);
      const morceaux: Blob[] = [];
      r.ondataavailable = (e) => morceaux.push(e.data);
      r.onstop = () => {
        setAudio(URL.createObjectURL(new Blob(morceaux, { type: r.mimeType })));
        flux.getTracks().forEach((t) => t.stop());
      };
      r.start();
      setEnreg(r);
    } catch {
      setErreurMicro("Micro inaccessible : autorisez-le dans le navigateur, ou entraînez-vous sans enregistrement.");
    }
  }

  function dicter() {
    if (!Reco) return;
    setErreurMicro("");
    const r = new Reco();
    r.lang = "fr-FR";
    r.continuous = true;
    r.interimResults = false;
    r.onresult = (e) => {
      let ajout = "";
      for (let i = e.resultIndex; i < e.results.length; i++) if (e.results[i].isFinal) ajout += e.results[i][0].transcript + " ";
      if (ajout.trim()) setTranscription((t) => (t.trim() ? t.trimEnd() + " " : "") + ajout.trim());
    };
    r.onerror = (e) => setErreurMicro(e.error === "not-allowed" ? "Micro refusé : autorisez-le dans le navigateur." : "La transcription s’est interrompue : complétez-la à la main si besoin.");
    r.onend = () => setDictee(null);
    try {
      r.start();
      setDictee({ stop: () => r.stop() });
    } catch {
      setErreurMicro("La transcription n’a pas pu démarrer sur ce navigateur.");
    }
  }

  async function retourIA() {
    setErreurIA("");
    setAttenteIA(true);
    try {
      setCorrection(await corrigerOral({ consigne: a.consigne, texte: transcription, niveau: a.niveau, examen: nomsExamens(a), langue: profil.langueIA }));
    } catch (e) {
      setErreurIA((e as Error).message);
    } finally {
      setAttenteIA(false);
    }
  }

  function terminer() {
    setFini(true);
    const reponses: Record<string, string> = {};
    a.points.forEach((p, i) => (reponses[typo(p)] = coches[i] ? "oui" : "non"));
    if (correction) enregistrer(Math.round(correction.note * 10) / 10, 20, { reponses, production: transcription, correction });
    else enregistrer(coches.filter(Boolean).length, a.points.length, { reponses, production: transcription.trim() || undefined });
  }

  return (
    <>
      <Documents docs={a.documents} />
      {a.support && (
        <section className="carte">
          <h2>{a.support.titre}</h2>
          <p className="petit">Prenez des notes pendant l’écoute.</p>
          <Lecteur texte={a.support.contenu} ecoutesMax={a.support.ecoutesMax ?? 2} niveau={a.niveau} fichier={a.support.fichierAudio} />
        </section>
      )}
      <div className="grille-2">
        {a.preparation > 0 && <section className="carte"><Chrono minutes={a.preparation} label="Préparation" /></section>}
        <section className="carte"><Chrono minutes={a.parole} label="Prise de parole" /></section>
      </div>
      <section className="carte">
        <h2>S’enregistrer pour se réécouter</h2>
        <p className="petit">L’enregistrement reste sur votre appareil ; il n’est envoyé à personne.</p>
        {!enreg ? <button className="btn" onClick={demarrer}>● Enregistrer</button>
          : <button className="btn attention-btn" onClick={() => { enreg.stop(); setEnreg(null); }}>■ Arrêter</button>}
        {audio && <audio controls src={audio} />}
      </section>
      <section className="carte">
        <h2>Transcription et retour de l’IA</h2>
        <p className="petit">
          {Reco ? "Dictez votre prise de parole : le texte s’écrit au fur et à mesure. " : "La dictée n’est pas disponible sur ce navigateur : vous pouvez écrire ce que vous avez dit. "}
          L’IA commente le contenu, l’organisation et la langue ; la prononciation n’est pas évaluée.
        </p>
        {Reco && (!dictee ? <button className="btn secondaire" onClick={dicter} disabled={fini}>🎙 Dicter ma prise de parole</button>
          : <button className="btn attention-btn" onClick={() => dictee.stop()}>■ Arrêter la dictée</button>)}
        <label className="champ">Transcription (modifiable)
          <textarea rows={6} value={transcription} disabled={fini} onChange={(e) => setTranscription(e.target.value)} lang="fr" />
        </label>
        <p className="petit">{mots} mots</p>
        {erreurMicro && <p className="erreur">{erreurMicro}</p>}
        {erreurIA && <p className="erreur" role="alert">{erreurIA}</p>}
        {!correction && (
          <button className="btn" onClick={retourIA} disabled={mots < 20 || attenteIA || fini}>
            {attenteIA ? "Analyse en cours…" : "Obtenir un retour sur ma prise de parole"}
          </button>
        )}
      </section>
      {correction && <CorrectionVue c={correction} />}
      <details className="carte">
        <summary>Aide : expressions utiles</summary>
        <ul>{a.aide.map((x) => <li key={x}><T>{x}</T></li>)}</ul>
      </details>
      <section className="carte">
        <h2>Auto-évaluation</h2>
        <p className="petit">Réécoutez-vous, puis cochez honnêtement ce que vous avez réussi. Votre professeur pourra compléter avec sa propre note.</p>
        {a.points.map((p, i) => (
          <label key={p} className="case">
            <input type="checkbox" checked={coches[i]} disabled={fini} onChange={() => setCoches(coches.map((c, j) => (j === i ? !c : c)))} />
            <T>{p}</T>
          </label>
        ))}
        {!fini ? (
          <button className="btn" onClick={terminer}>
            {correction ? `Enregistrer (note de l’IA : ${correction.note}/20)` : "Enregistrer mon auto-évaluation"}
          </button>
        ) : (
          <p>{correction ? `Note enregistrée : ${correction.note}/20.` : `Auto-évaluation : ${coches.filter(Boolean).length} / ${a.points.length}`}</p>
        )}
      </section>
    </>
  );
}
