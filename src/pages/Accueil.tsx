import { backend } from "../lib/instance";
import { useDonnee, useProfil } from "../lib/hooks";
import { ACTIVITES, activite } from "../data/activities";
import { EXAMENS } from "../data/exams";
import { NIVEAUX, type ExamId, type Niveau } from "../lib/types";
import { dateFr, pct, statistiques } from "../lib/util";
import { BadgeComp, Badge, Jauge, Vide } from "../components/ui";

export default function Accueil() {
  const { profil } = useProfil();
  return profil.role === "eleve" ? <AccueilEleve /> : <AccueilProf />;
}

function AccueilEleve() {
  const { profil, setProfil } = useProfil();
  const { data: devoirs } = useDonnee(() => backend.devoirs(), []);
  const { data: tentatives } = useDonnee(() => backend.tentatives(profil.id), [profil.id]);
  const { data: liens } = useDonnee(() => backend.liens(), []);

  const aFaire = (devoirs ?? []).filter((d) => d.statut === "a_faire");
  const stats = statistiques(tentatives ?? []);
  const faites = new Set((tentatives ?? []).map((t) => t.activiteId));
  const suggestions = ACTIVITES.filter(
    (a) => (!profil.niveauVise || a.niveau === profil.niveauVise) && (!profil.examenVise || a.examens.includes(profil.examenVise)) && !faites.has(a.id),
  ).slice(0, 4);
  const prof = (liens ?? []).find((l) => l.statut === "actif");
  const invitationsRecues = (liens ?? []).filter((l) => l.statut === "en_attente" && l.initiateurId !== profil.id);

  const maj = async (champ: "niveauVise" | "examenVise", v: string) => setProfil(await backend.majProfil({ [champ]: v || undefined }));

  return (
    <div className="pile">
      <section className="accueil-tete">
        <div>
          <h1>Bonjour {profil.nom.split(" ")[0]} !</h1>
          <p className="sous-titre">Votre objectif :</p>
          <div className="objectif">
            <select aria-label="Examen visé" value={profil.examenVise ?? ""} onChange={(e) => maj("examenVise", e.target.value as ExamId)}>
              <option value="">Choisir un examen</option>
              {EXAMENS.map((e) => <option key={e.id} value={e.id}>{e.nom}</option>)}
            </select>
            <select aria-label="Niveau visé" value={profil.niveauVise ?? ""} onChange={(e) => maj("niveauVise", e.target.value as Niveau)}>
              <option value="">Niveau visé</option>
              {NIVEAUX.map((n) => <option key={n}>{n}</option>)}
            </select>
          </div>
        </div>
      </section>

      {invitationsRecues.length > 0 && (
        <div className="carte alerte-info">
          Vous avez {invitationsRecues.length} invitation(s) d’un professeur. <a href="#/liens">Répondre</a>
        </div>
      )}

      <div className="grille-2">
        <section className="carte">
          <h2>Devoirs de votre professeur</h2>
          {!prof && <Vide>Aucun professeur lié. <a href="#/liens">Inviter mon professeur</a></Vide>}
          {prof && aFaire.length === 0 && <Vide>Aucun devoir en attente.</Vide>}
          <ul className="liste">
            {aFaire.map((d) => {
              const a = activite(d.activiteId);
              return a ? (
                <li key={d.id}>
                  <a href={`#/activite/${a.id}?devoir=${d.id}`}>{a.titre}</a> <BadgeComp c={a.competence} /> <Badge>{a.niveau}</Badge>
                  {d.echeance && <span className="petit"> · pour le {dateFr(d.echeance)}</span>}
                  {d.consigne && <div className="petit">« {d.consigne} »</div>}
                </li>
              ) : null;
            })}
          </ul>
        </section>

        <section className="carte">
          <h2>Vos progrès</h2>
          {stats.length === 0 ? (
            <Vide>Faites une première activité pour voir vos résultats.</Vide>
          ) : (
            <ul className="liste-stats">
              {stats.map((s) => (
                <li key={s.competence}>
                  <BadgeComp c={s.competence} />
                  <Jauge valeur={s.moyenne} label={s.competence} />
                  <span>{pct(s.moyenne)}</span>
                </li>
              ))}
            </ul>
          )}
          <a href="#/progres" className="lien-fleche">Voir le détail et le plan d’amélioration →</a>
        </section>
      </div>

      <section className="carte">
        <h2>Suggestions pour vous</h2>
        {suggestions.length === 0 ? (
          <Vide>Vous avez fait toutes les activités correspondant à votre objectif. <a href="#/activites">Explorer la banque</a></Vide>
        ) : (
          <div className="grille-cartes">
            {suggestions.map((a) => (
              <a key={a.id} className="mini-carte" href={`#/activite/${a.id}`}>
                <div><BadgeComp c={a.competence} /> <Badge>{a.niveau}</Badge></div>
                <b>{a.titre}</b>
                <span className="petit">{a.theme} · {a.duree} min</span>
              </a>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function AccueilProf() {
  const { profil } = useProfil();
  const { data: liens } = useDonnee(() => backend.liens(), []);
  const eleves = (liens ?? []).filter((l) => l.statut === "actif" && l.eleveId);
  const attente = (liens ?? []).filter((l) => l.statut === "en_attente");

  return (
    <div className="pile">
      <div className="titre-ligne">
        <h1>Bonjour {profil.nom.split(" ")[0]} !</h1>
        <a className="btn" href="#/liens">Inviter un élève</a>
      </div>
      {attente.length > 0 && (
        <div className="carte alerte-info">{attente.length} invitation(s) en attente. <a href="#/liens">Voir</a></div>
      )}
      <section className="carte">
        <h2>Mes élèves</h2>
        {eleves.length === 0 ? (
          <Vide>Aucun élève lié pour l’instant. Invitez vos élèves par courriel : ils acceptent, et vous suivez leurs progrès.</Vide>
        ) : (
          <div className="tableau-defile">
            <table className="tableau">
              <thead>
                <tr><th>Élève</th><th>Activités (7 j)</th><th>Réussite moyenne</th><th>Devoirs à faire</th><th>Dernière activité</th></tr>
              </thead>
              <tbody>
                {eleves.map((l) => <LigneEleve key={l.id} id={l.eleveId!} nom={l.eleveNom ?? l.eleveEmail ?? ""} />)}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function LigneEleve({ id, nom }: { id: string; nom: string }) {
  const { data: ts } = useDonnee(() => backend.tentatives(id), [id]);
  const { data: ds } = useDonnee(() => backend.devoirs(id), [id]);
  const semaine = (ts ?? []).filter((t) => Date.now() - new Date(t.faiteLe).getTime() < 7 * 86400000).length;
  const moy = ts?.length ? ts.reduce((s, t) => s + t.score / t.max, 0) / ts.length : undefined;
  return (
    <tr>
      <td><a href={`#/eleve/${id}`}><b>{nom}</b></a></td>
      <td>{semaine}</td>
      <td>{moy === undefined ? "—" : <span className="cellule-jauge"><Jauge valeur={moy} /> {pct(moy)}</span>}</td>
      <td>{(ds ?? []).filter((d) => d.statut === "a_faire").length}</td>
      <td>{ts?.[0] ? dateFr(ts[0].faiteLe) : "—"}</td>
    </tr>
  );
}
