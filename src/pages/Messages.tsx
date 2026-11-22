import { useEffect, useRef, useState } from "react";
import { backend } from "../lib/instance";
import { useDonnee, useProfil } from "../lib/hooks";
import { dateFr } from "../lib/util";
import { Vide } from "../components/ui";

export default function Messages({ avec }: { avec?: string }) {
  const { profil } = useProfil();
  const { data: liens } = useDonnee(() => backend.liens(), []);
  const { data: nonLus } = useDonnee(() => backend.nonLus(), []);
  const contacts = (liens ?? [])
    .filter((l) => l.statut === "actif")
    .map((l) => (profil.role === "eleve"
      ? { id: l.professeurId!, nom: l.professeurNom || l.professeurEmail, suspendu: l.suspendu }
      : { id: l.eleveId!, nom: l.eleveNom || l.eleveEmail, suspendu: l.suspendu }))
    .filter((c) => c.id);
  const courant = avec ?? contacts[0]?.id;

  return (
    <div className="pile">
      <h1>Messages</h1>
      {liens && contacts.length === 0 ? (
        <Vide>Les messages sont disponibles une fois le lien élève–professeur accepté. <a href="#/liens">Gérer les liens</a></Vide>
      ) : (
        <div className="messagerie">
          <nav className="contacts" aria-label="Contacts">
            {contacts.map((c) => (
              <a key={c.id} href={`#/messages/${c.id}`} aria-current={c.id === courant ? "page" : undefined}>
                {c.nom}
                {!!nonLus?.[c.id] && <span className="pastille" aria-label={`${nonLus[c.id]} non lu(s)`}>{nonLus[c.id]}</span>}
              </a>
            ))}
          </nav>
          {courant && <Fil autreId={courant} suspendu={contacts.find((c) => c.id === courant)?.suspendu} />}
        </div>
      )}
    </div>
  );
}

export function Fil({ autreId, suspendu }: { autreId: string; suspendu?: boolean }) {
  const { profil } = useProfil();
  const { data: msgs } = useDonnee(() => backend.conversation(autreId), [autreId]);
  const [texte, setTexte] = useState("");
  const [erreur, setErreur] = useState("");
  const fil = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (fil.current) fil.current.scrollTop = fil.current.scrollHeight;
    if (msgs?.some((m) => m.deId === autreId && !m.lu)) backend.marquerLus(autreId);
  }, [msgs, autreId]);

  return (
    <section className="carte fil-messages">
      <div className="fil" ref={fil} aria-live="polite">
        {(msgs ?? []).length === 0 && <Vide>Aucun message. Écrivez le premier !</Vide>}
        {(msgs ?? []).map((m) => (
          <div key={m.id} className={`bulle ${m.deId === profil.id ? "moi" : "ia"}`}>
            <p>{m.texte}</p>
            <span className="petit">{dateFr(m.envoyeLe, true)}</span>
          </div>
        ))}
      </div>
      {suspendu ? (
        <p className="note">Le lien est suspendu : l’un des deux accès a expiré. Les messages reprendront après le renouvellement.</p>
      ) : (
        <form className="saisie-chat" onSubmit={async (e) => {
          e.preventDefault();
          if (!texte.trim()) return;
          try { await backend.envoyer(autreId, texte); setTexte(""); setErreur(""); } catch (x) { setErreur((x as Error).message); }
        }}>
          <textarea rows={2} value={texte} onChange={(e) => setTexte(e.target.value)} aria-label="Votre message" placeholder="Votre message…" />
          <button className="btn">Envoyer</button>
        </form>
      )}
      {erreur && <p className="erreur">{erreur}</p>}
    </section>
  );
}
