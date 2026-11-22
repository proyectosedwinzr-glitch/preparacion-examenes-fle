import { useState } from "react";
import { backend } from "../lib/instance";
import { useDonnee, useProfil } from "../lib/hooks";
import { activite } from "../data/activities";
import { EXAMENS } from "../data/exams";
import { dateFr, jourLocal, joursAvant } from "../lib/util";
import { Badge, BadgeComp, Vide } from "../components/ui";
import Assigner from "../components/Assigner";
import Progres from "./Progres";
import { Fil } from "./Messages";

/** Fiche d’un élève vue par son professeur : mêmes progrès que l’élève, plus devoirs et messages. */
export default function EleveDetail({ id }: { id: string }) {
  const { profil } = useProfil();
  const { data: liens } = useDonnee(() => backend.liens(), []);
  const { data: devoirs, recharger } = useDonnee(() => backend.devoirs(id), [id]);
  const [assigner, setAssigner] = useState(false);
  const [erreur, setErreur] = useState("");
  const lien = (liens ?? []).find((l) => l.eleveId === id && l.statut === "actif");

  if (profil.role !== "professeur") return <p>Page réservée aux professeurs.</p>;
  if (liens && !lien) return <p>Cet élève n’est pas lié à votre compte. <a href="#/liens">Gérer les liens</a></p>;
  const nom = lien?.eleveNom || lien?.eleveEmail || "";
  const o = lien?.eleveObjectif;
  const quoi = [EXAMENS.find((e) => e.id === o?.examen)?.nom, o?.niveau].filter(Boolean).join(" ");
  const j = o?.dateExamen ? joursAvant(o.dateExamen) : null;
  const auj = jourLocal();

  async function supprimer(devoirId: string) {
    try {
      await backend.supprimerDevoir(devoirId);
      recharger();
    } catch (e) {
      setErreur((e as Error).message);
    }
  }

  return (
    <div className="pile">
      <a href="#/" className="retour">← Mes élèves</a>
      <div className="titre-ligne">
        <h1>{nom}</h1>
        {!lien?.suspendu && <button className="btn" onClick={() => setAssigner(true)}>Assigner une activité</button>}
      </div>
      <p className="sous-titre">
        Objectif : {quoi || "non renseigné"}
        {o?.dateExamen && <> · examen le {dateFr(o.dateExamen)}{j !== null && j >= 0 && ` (J-${j})`}</>}
      </p>
      {lien?.suspendu && <p className="note">Le lien est suspendu : l’un des deux accès a expiré. Les résultats réapparaîtront après le renouvellement.</p>}
      <section className="carte">
        <h2>Devoirs</h2>
        {erreur && <p className="erreur">{erreur}</p>}
        {(devoirs ?? []).length === 0 ? <Vide>Aucun devoir assigné.</Vide> : (
          <ul className="liste">
            {devoirs!.map((d) => {
              const a = activite(d.activiteId);
              const retard = d.statut === "a_faire" && d.echeance && d.echeance < auj;
              return (
                <li key={d.id} className="ligne-lien">
                  <span>
                    {a ? <><BadgeComp c={a.competence} /> <Badge>{a.niveau}</Badge> <a href={`#/activite/${a.id}`}>{a.titre}</a></> : d.activiteId}{" "}
                    <Badge ton={d.statut === "fait" ? "ok" : "attention"}>{d.statut === "fait" ? "rendu" : retard ? "en retard" : "à faire"}</Badge>
                    {d.echeance && <span className="petit"> · pour le {dateFr(d.echeance)}</span>}
                  </span>
                  {d.statut === "a_faire" && <button className="btn-lien" onClick={() => supprimer(d.id)}>Retirer</button>}
                </li>
              );
            })}
          </ul>
        )}
      </section>
      <Progres eleveId={id} nomEleve={nom} />
      <section>
        <h2>Messages avec {nom}</h2>
        <Fil autreId={id} suspendu={lien?.suspendu} />
      </section>
      {assigner && <Assigner eleveId={id} fermer={() => { setAssigner(false); recharger(); }} />}
    </div>
  );
}
