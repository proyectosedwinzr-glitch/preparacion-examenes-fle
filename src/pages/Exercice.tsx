import { useEffect, useMemo, useRef, useState } from "react";
import { activite, type Activite, type ItemQCM } from "../data/activities";
import { EXAMENS } from "../data/exams";
import { backend } from "../lib/instance";
import { useProfil, useRoute } from "../lib/hooks";
import { corriger } from "../lib/ai";
import type { CorrectionIA, Niveau } from "../lib/types";
import { compterMots, melanger, typo, verifier, type Verdict } from "../lib/util";
import { Badge, BadgeComp, Paragraphes, T } from "../components/ui";
import CorrectionVue from "../components/CorrectionVue";

type Enregistrer = (score: number, max: number, extra?: { reponses?: Record<string, string>; production?: string; correction?: CorrectionIA }) => Promise<void>;

export default function Exercice({ id }: { id: string }) {
  const a = activite(id);
  const { profil } = useProfil();
  const { params } = useRoute();
  const devoirId = params.get("devoir") ?? undefined;
  const [enregistre, setEnregistre] = useState<string>();

  if (!a) return <p>Activité introuvable. <a href="#/activites">Retour</a></p>;
  const apercu = profil.role === "professeur";

  const enregistrer: Enregistrer = async (score, max, extra) => {
    if (apercu) return setEnregistre("Aperçu professeur : le résultat n’est pas enregistré.");
    try {
      await backend.enregistrerTentative({
        activiteId: a.id, titre: a.titre, niveau: a.niveau, competence: a.competence, examens: a.examens,
        score, max, devoirId, ...extra,
      });
      setEnregistre(devoirId ? "Résultat enregistré et devoir rendu à votre professeur." : "Résultat enregistré dans vos progrès.");
    } catch (e) {
      setEnregistre("Échec de l’enregistrement : " + (e as Error).message);
    }
  };

  return (
    <article className="pile exercice">
      <a href="#/activites" className="retour">← Activités</a>
      <header>
        <div className="badges">
          <Badge>{a.niveau}</Badge> <BadgeComp c={a.competence} /> <span className="petit">{a.theme} · environ {a.duree} min</span>
        </div>
        <h1><T>{a.titre}</T></h1>
        <p className="petit">Examens : {a.examens.map((e) => EXAMENS.find((x) => x.id === e)?.nom).join(", ")}</p>
        {apercu && <p className="note">Aperçu professeur : vous pouvez faire l’activité, rien n’est enregistré.</p>}
        {devoirId && <p className="note">Devoir de votre professeur.</p>}
        <p className="consigne"><T>{a.consigne}</T></p>
      </header>
      {a.type === "qcm" && <QCM a={a} enregistrer={enregistrer} />}
      {a.type === "trous" && <Trous a={a} enregistrer={enregistrer} />}
      {a.type === "production" && <Production a={a} enregistrer={enregistrer} />}
      {a.type === "oral" && <Oral a={a} enregistrer={enregistrer} />}
      {enregistre && <p className="succes" role="status">{enregistre}</p>}
    </article>
  );
}

// ───────────────────────── Audio (synthèse vocale) ─────────────────────────

function useVoixFr() {
  const [voix, setVoix] = useState<SpeechSynthesisVoice | null>(null);
  useEffect(() => {
    if (!("speechSynthesis" in window)) return;
    const choisir = () => {
      const v = speechSynthesis.getVoices().filter((x) => x.lang.toLowerCase().startsWith("fr"));
      setVoix(v.find((x) => x.lang === "fr-FR") ?? v[0] ?? null);
    };
    choisir();
    speechSynthesis.addEventListener("voiceschanged", choisir);
    return () => speechSynthesis.removeEventListener("voiceschanged", choisir);
  }, []);
  return voix;
}

function Lecteur({ texte, ecoutesMax, niveau, onFin }: { texte: string; ecoutesMax: number; niveau: Niveau; onFin?: () => void }) {
  const voix = useVoixFr();
  const [ecoutes, setEcoutes] = useState(0);
  const [enCours, setEnCours] = useState(false);
  const dispo = "speechSynthesis" in window;
  useEffect(() => () => { if (dispo) speechSynthesis.cancel(); }, [dispo]);

  function jouer() {
    if (!dispo || ecoutes >= ecoutesMax) return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(texte);
    u.lang = "fr-FR";
    if (voix) u.voice = voix;
    u.rate = niveau === "A1" || niveau === "A2" ? 0.85 : niveau === "B1" ? 0.95 : 1;
    u.onend = () => { setEnCours(false); onFin?.(); };
    setEnCours(true);
    setEcoutes((x) => x + 1);
    speechSynthesis.speak(u);
  }

  if (!dispo) return <p className="erreur">Votre navigateur ne lit pas l’audio de synthèse. Essayez Chrome, Edge ou Safari récents.</p>;
  return (
    <div className="lecteur">
      <button className="btn" onClick={jouer} disabled={enCours || ecoutes >= ecoutesMax}>
        {enCours ? "Écoute en cours…" : ecoutes === 0 ? "▶ Écouter" : "▶ Réécouter"}
      </button>
      <span className="petit">Écoutes : {ecoutes} / {ecoutesMax}</span>
      {!voix && <span className="petit">Aucune voix française détectée sur cet appareil : la lecture peut être approximative.</span>}
      <span className="petit">Audio provisoire (voix de synthèse).</span>
    </div>
  );
}

// ───────────────────────── QCM ─────────────────────────

function QCM({ a, enregistrer }: { a: Extract<Activite, { type: "qcm" }>; enregistrer: Enregistrer }) {
  const items = useMemo(
    () => a.items.map((it, i) => ({ ...it, ordre: melanger(it.options.map((_, k) => k), `${a.id}-${i}`) })),
    [a],
  );
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
          <Lecteur texte={a.support.contenu} ecoutesMax={a.support.ecoutesMax ?? 2} niveau={a.niveau} />
        </section>
      )}
      <ol className="questions">
        {items.map((it, i) => (
          <li key={i} className="carte question">
            <p className="q"><T>{it.q}</T></p>
            <div className="options" role="radiogroup">
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
        <button className="btn" onClick={valider} disabled={!toutRepondu}>{toutRepondu ? "Valider mes réponses" : `Répondez à toutes les questions (${Object.keys(rep).length}/${items.length})`}</button>
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

function Production({ a, enregistrer }: { a: Extract<Activite, { type: "production" }>; enregistrer: Enregistrer }) {
  const { profil } = useProfil();
  const cle = `tremplin-brouillon-${a.id}`;
  const [texte, setTexte] = useState(() => localStorage.getItem(cle) ?? "");
  const [etat, setEtat] = useState<"redaction" | "correction" | "corrige">("redaction");
  const [correction, setCorrection] = useState<CorrectionIA>();
  const [erreur, setErreur] = useState("");
  const zone = useRef<HTMLTextAreaElement>(null);
  const mots = compterMots(texte);
  useEffect(() => localStorage.setItem(cle, texte), [cle, texte]);

  async function envoyer() {
    setErreur("");
    setEtat("correction");
    try {
      const c = await corriger({
        consigne: a.consigne, texte, niveau: a.niveau, motsMin: a.motsMin,
        examen: a.examens.map((e) => EXAMENS.find((x) => x.id === e)?.nom).join(", "), langue: profil.langueIA,
      });
      setCorrection(c);
      setEtat("corrige");
      localStorage.removeItem(cle);
      await enregistrer(Math.round(c.note * 10) / 10, 20, { production: texte, correction: c });
    } catch (e) {
      setErreur((e as Error).message);
      setEtat("redaction");
    }
  }

  return (
    <>
      {a.documents && (
        <div className="grille-2">
          {a.documents.map((d) => (
            <section key={d.titre} className="carte document"><h2><T>{d.titre}</T></h2><p><T>{d.texte}</T></p></section>
          ))}
        </div>
      )}
      <details className="carte">
        <summary>Critères d’évaluation</summary>
        <ul>{a.grille.map((g) => <li key={g}><T>{g}</T></li>)}</ul>
      </details>
      <section className="carte">
        <label className="champ">Votre texte
          <textarea ref={zone} rows={14} value={texte} disabled={etat !== "redaction"} onChange={(e) => setTexte(e.target.value)} spellCheck={false} lang="fr" />
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

function Chrono({ minutes, label, onFin }: { minutes: number; label: string; onFin?: () => void }) {
  const [reste, setReste] = useState(minutes * 60);
  const [actif, setActif] = useState(false);
  useEffect(() => {
    if (!actif) return;
    if (reste <= 0) { setActif(false); onFin?.(); return; }
    const t = setTimeout(() => setReste((r) => r - 1), 1000);
    return () => clearTimeout(t);
  }, [actif, reste, onFin]);
  const mm = String(Math.floor(reste / 60)).padStart(2, "0");
  const ss = String(reste % 60).padStart(2, "0");
  return (
    <div className="chrono">
      <span className="petit">{label}</span>
      <span className={`chrono-temps ${reste < 30 ? "attention" : ""}`}>{mm}:{ss}</span>
      <button className="btn secondaire petit-btn" onClick={() => setActif(!actif)}>{actif ? "Pause" : reste === minutes * 60 ? "Démarrer" : "Reprendre"}</button>
      <button className="btn-lien" onClick={() => { setActif(false); setReste(minutes * 60); }}>Réinitialiser</button>
    </div>
  );
}

function Oral({ a, enregistrer }: { a: Extract<Activite, { type: "oral" }>; enregistrer: Enregistrer }) {
  const [coches, setCoches] = useState<boolean[]>(a.points.map(() => false));
  const [audio, setAudio] = useState<string>();
  const [enreg, setEnreg] = useState<MediaRecorder | null>(null);
  const [erreurMicro, setErreurMicro] = useState("");
  const [fini, setFini] = useState(false);

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

  return (
    <>
      <div className="grille-2">
        {a.preparation > 0 && <section className="carte"><Chrono minutes={a.preparation} label="Préparation" /></section>}
        <section className="carte"><Chrono minutes={a.parole} label="Prise de parole" /></section>
      </div>
      <section className="carte">
        <h2>S’enregistrer pour se réécouter</h2>
        <p className="petit">L’enregistrement reste sur votre appareil ; il n’est envoyé à personne.</p>
        {!enreg ? <button className="btn" onClick={demarrer}>● Enregistrer</button>
          : <button className="btn attention-btn" onClick={() => { enreg.stop(); setEnreg(null); }}>■ Arrêter</button>}
        {erreurMicro && <p className="erreur">{erreurMicro}</p>}
        {audio && <audio controls src={audio} />}
      </section>
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
          <button className="btn" onClick={() => {
            setFini(true);
            const reponses: Record<string, string> = {};
            a.points.forEach((p, i) => (reponses[typo(p)] = coches[i] ? "oui" : "non"));
            enregistrer(coches.filter(Boolean).length, a.points.length, { reponses });
          }}>Enregistrer mon auto-évaluation</button>
        ) : <p>Auto-évaluation : {coches.filter(Boolean).length} / {a.points.length}</p>}
      </section>
    </>
  );
}
