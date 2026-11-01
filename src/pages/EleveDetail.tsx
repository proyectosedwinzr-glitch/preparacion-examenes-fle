import { useState } from "react";
import { backend } from "../lib/instance";
import { useDonnee, useProfil } from "../lib/hooks";
import { activite } from "../data/activities";
import { dateFr } from "../lib/util";
import { Badge, BadgeComp, Vide } from "../components/ui";
import Assigner from "../components/Assigner";
import Progres from "./Progres";
import { Fil } from "./Messages";

/** Fiche d’un élève vue par son professeur : mêmes progrès que l’élève, plus devoirs et messages. */
export default function EleveDetail({ id }: { id: string }) {
  const { profil } = useProfil();
  const { data: liens } = useDonnee(() => backend.liens(), []);
  const { data: devoirs } = useDonnee(() => backend.devoirs(id), [id]);
  const [assigner, setAssigner] = useState(false);
  const lien = (liens ?? []).find((l) => l.eleveId === id && l.statut === "actif");

  if (profil.role !== "professeur") return <p>Page réservée aux professeurs.</p>;
  if (liens && !lien) return <p>Cet élève n’est pas lié à votre compte. <a href="#/liens">Gérer les liens</a></p>;
  const nom = lien?.eleveNom || lien?.eleveEmail || "";

  return (
    <div className="pile">
      <a href="#/" className="retour">← Mes élèves</a>
      <div className="titre-ligne">
        <h1>{nom}</h1>
        <button className="btn" onClick={() => setAssigner(true)}>Assigner une activité</button>
      </div>
      <section className="carte">
        <h2>Devoirs</h2>
        {(devoirs ?? []).length === 0 ? <Vide>Aucun devoir assigné.</Vide> : (
          <ul className="liste">
            {devoirs!.map((d) => {
              const a = activite(d.activiteId);
              return (
                <li key={d.id}>
                  {a ? <><BadgeComp c={a.competence} /> <Badge>{a.niveau}</Badge> {a.titre}</> : d.activiteId}
                  {" "}<Badge ton={d.statut === "fait" ? "ok" : "attention"}>{d.statut === "fait" ? "rendu" : "à faire"}</Badge>
                  {d.echeance && <span className="petit"> · pour le {dateFr(d.echeance)}</span>}
                </li>
              );
            })}
          </ul>
        )}
      </section>
      <Progres eleveId={id} nomEleve={nom} />
      <section>
        <h2>Messages avec {nom}</h2>
        <Fil autreId={id} />
      </section>
      {assigner && <Assigner eleveId={id} fermer={() => setAssigner(false)} />}
    </div>
  );
}
