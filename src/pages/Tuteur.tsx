import { useState } from "react";
import { tuteur, type MessageTuteur } from "../lib/ai";
import { useProfil } from "../lib/hooks";
import { Paragraphes } from "../components/ui";

const SUGGESTIONS = [
  "Quelle différence entre « depuis » et « il y a » ?",
  "Comment structurer un essai argumenté au DELF B2 ?",
  "Explique-moi l’accord du participe passé avec avoir.",
  "Donne-moi 5 connecteurs pour exprimer la conséquence.",
];

export default function Tuteur() {
  const { profil } = useProfil();
  const [hist, setHist] = useState<MessageTuteur[]>([]);
  const [saisie, setSaisie] = useState("");
  const [attente, setAttente] = useState(false);

  async function envoyer(texte: string) {
    if (!texte.trim() || attente) return;
    const h: MessageTuteur[] = [...hist, { role: "user", content: texte.trim() }];
    setHist(h);
    setSaisie("");
    setAttente(true);
    try {
      const r = await tuteur(h, profil.langueIA, profil.niveauVise);
      setHist([...h, { role: "assistant", content: r }]);
    } catch (e) {
      setHist([...h, { role: "assistant", content: "⚠ " + (e as Error).message }]);
    } finally {
      setAttente(false);
    }
  }

  return (
    <div className="pile tuteur">
      <h1>Tuteur IA</h1>
      <p className="sous-titre">Posez vos questions de grammaire, de vocabulaire ou de méthode. Langue des explications : modifiable dans <a href="#/compte">Mon compte</a>.</p>
      <section className="carte fil">
        {hist.length === 0 && (
          <div className="suggestions">
            {SUGGESTIONS.map((s) => <button key={s} className="btn secondaire" onClick={() => envoyer(s)}>{s}</button>)}
          </div>
        )}
        {hist.map((m, i) => (
          <div key={i} className={`bulle ${m.role === "user" ? "moi" : "ia"}`}><Paragraphes texte={m.content} /></div>
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
