import { useEffect, useRef, useState } from "react";
import { tuteur, type MessageTuteur } from "../lib/ai";
import { backend } from "../lib/instance";
import { useProfil } from "../lib/hooks";
import { Paragraphes } from "../components/ui";

const SUGGESTIONS = [
  "Quelle différence entre « depuis » et « il y a » ?",
  "Comment structurer un essai argumenté au DELF B2 ?",
  "Explique-moi l’accord du participe passé avec avoir.",
  "Donne-moi cinq connecteurs pour exprimer la conséquence.",
];

function lireHistorique(cle: string): MessageTuteur[] {
  try {
    return JSON.parse(localStorage.getItem(cle) ?? "[]");
  } catch {
    return [];
  }
}

export default function Tuteur() {
  const { profil } = useProfil();
  const cle = `tremplin-tuteur-${profil.id}`;
  const [hist, setHist] = useState<MessageTuteur[]>(() => lireHistorique(cle));
  const [saisie, setSaisie] = useState("");
  const [attente, setAttente] = useState(false);
  const fil = useRef<HTMLElement>(null);
  useEffect(() => {
    try {
      localStorage.setItem(cle, JSON.stringify(hist.slice(-40)));
    } catch {
      /* stockage indisponible : l’historique n’est pas conservé */
    }
    if (fil.current) fil.current.scrollTop = fil.current.scrollHeight;
  }, [cle, hist]);

  async function envoyer(texte: string) {
    if (!texte.trim() || attente) return;
    const h: MessageTuteur[] = [...hist, { role: "user", content: texte.trim() }];
    setHist(h);
    setSaisie("");
    setAttente(true);
    const r = await tuteur(h, profil.langueIA, profil.niveauVise);
    setHist([...h, r]);
    setAttente(false);
  }

  return (
    <div className="pile tuteur">
      <div className="titre-ligne">
        <h1>Tuteur</h1>
        {hist.length > 0 && <button className="btn-lien" onClick={() => setHist([])}>Effacer la conversation</button>}
      </div>
      <p className="sous-titre">
        Posez vos questions de grammaire, de vocabulaire ou de méthode. {backend.mode === "demo" ? "En démonstration, le tuteur répond avec les fiches de l’application." : "Le tuteur vous indique aussi les fiches utiles."}{" "}
        Langue des explications : <a href="#/compte">Mon compte</a>.
      </p>
      <section className="carte fil" ref={fil} aria-live="polite">
        {hist.length === 0 && (
          <div className="suggestions">
            {SUGGESTIONS.map((s) => <button key={s} className="btn secondaire" onClick={() => envoyer(s)}>{s}</button>)}
          </div>
        )}
        {hist.map((m, i) => (
          <div key={i} className={`bulle ${m.role === "user" ? "moi" : "ia"}`}>
            <Paragraphes texte={m.content} />
            {m.liens && m.liens.length > 0 && (
              <ul className="liens-tuteur">{m.liens.map((l) => <li key={l.href}><a href={l.href}>{l.label} →</a></li>)}</ul>
            )}
          </div>
        ))}
        {attente && <div className="bulle ia">…</div>}
      </section>
      <form className="saisie-chat" onSubmit={(e) => { e.preventDefault(); envoyer(saisie); }}>
        <textarea rows={2} value={saisie} onChange={(e) => setSaisie(e.target.value)} placeholder="Votre question…" aria-label="Votre question"
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); envoyer(saisie); } }} />
        <button className="btn" disabled={attente}>Envoyer</button>
      </form>
    </div>
  );
}
