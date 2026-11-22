import { backend } from "../lib/instance";
import { useDonnee, useProfil } from "../lib/hooks";
import { activite } from "../data/activities";
import { EXAMENS } from "../data/exams";
import { NIVEAUX, type ExamId, type Niveau, type Profil } from "../lib/types";
import { dateFr, jourLocal, joursAvant, pct, serieJours, statistiques, taux } from "../lib/util";
import { prochaineEtape, suggestions } from "../lib/plan";
import { Badge, BadgeComp, Jauge, Vide } from "../components/ui";

const prenom = (p: Profil) => (p.nom || p.email).split(/[ @]/)[0];
const pluriel = (n: number, mot: string) => `${n} ${mot}${n > 1 ? "s" : ""}`;
const JOUR = 86400000;

export default function Accueil() {
  const { profil } = useProfil();
  return profil.role === "eleve" ? <AccueilEleve /> : <AccueilProf />;
}

function Objectif() {
  const { profil, setProfil } = useProfil();
  const maj = async (m: Partial<Pick<Profil, "niveauVise" | "examenVise" | "dateExamen">>) => setProfil(await backend.majProfil(m));
  const j = profil.dateExamen ? joursAvant(profil.dateExamen) : null;
  const exam = EXAMENS.find((e) => e.id === profil.examenVise);
  const quoi = [exam?.nom, profil.niveauVise].filter(Boolean).join(" ");
  return (
    <section className="carte">
      <h2>Mon objectif</h2>
      <div className="objectif">
        <label className="champ-ligne">Examen
          <select aria-label="Examen visé" value={profil.examenVise ?? ""} onChange={(e) => maj({ examenVise: (e.target.value || undefined) as ExamId | undefined })}>
            <option value="">À choisir</option>
            {EXAMENS.map((e) => <option key={e.id} value={e.id}>{e.nom}</option>)}
          </select>
        </label>
        <label className="champ-ligne">Niveau
          <select aria-label="Niveau visé" value={profil.niveauVise ?? ""} onChange={(e) => maj({ niveauVise: (e.target.value || undefined) as Niveau | undefined })}>
            <option value="">À choisir</option>
            {NIVEAUX.map((n) => <option key={n}>{n}</option>)}
          </select>
        </label>
        <label className="champ-ligne">Date de l’examen
          <input type="date" aria-label="Date de l’examen" min={jourLocal()} value={profil.dateExamen ?? ""} onChange={(e) => maj({ dateExamen: e.target.value || undefined })} />
        </label>
      </div>
      {j !== null && (
        <p className="compte-a-rebours">
          {j > 0 ? <><b>J-{j}</b> avant votre examen{quoi ? ` (${quoi})` : ""}, le {dateFr(profil.dateExamen!)}.</>
            : j === 0 ? <b>C’est aujourd’hui : bon courage !</b>
            : <>La date indiquée est passée : mettez-la à jour.</>}
        </p>
      )}
      {!profil.niveauVise && <p className="petit">Vous ne connaissez pas votre niveau ? <a href="#/test-niveau">Passez le test de niveau</a>.</p>}
    </section>
  );
}

function AccueilEleve() {
  const { profil } = useProfil();
  const { data: devoirs } = useDonnee(() => backend.devoirs(), []);
  const { data: tentatives } = useDonnee(() => backend.tentatives(profil.id), [profil.id]);
  const { data: liens } = useDonnee(() => backend.liens(), []);
  const { data: plan } = useDonnee(() => backend.plan(profil.id), [profil.id]);
  const ts = tentatives ?? [];
  const aFaire = (devoirs ?? []).filter((d) => d.statut === "a_faire");
  const etape = prochaineEtape(profil, devoirs ?? [], ts, plan ?? null);
  const stats = statistiques(ts);
  const serie = serieJours(ts);
  const semaine = ts.filter((t) => Date.now() - new Date(t.faiteLe).getTime() < 7 * JOUR).length;
  const prof = (liens ?? []).find((l) => l.statut === "actif");
  const invitations = (liens ?? []).filter((l) => l.statut === "en_attente" && l.initiateurId !== profil.id && !l.incompatible);
  const sugg = suggestions(profil, ts, 4);
  const auj = jourLocal();

  return (
    <div className="pile">
      <h1>Bonjour {prenom(profil)} !</h1>
      {invitations.length > 0 && (
        <div className="carte alerte-info">Vous avez {pluriel(invitations.length, "invitation")} d’un professeur. <a href="#/liens">Répondre</a></div>
      )}
      <section className="carte etape">
        <p className="sur-titre">Votre prochaine étape</p>
        <h2>{etape.titre}</h2>
        <p>{etape.texte}</p>
        <a className="btn" href={etape.href}>{etape.bouton}</a>
      </section>

      <div className="grille-2">
        <Objectif />
        <section className="carte">
          <h2>Votre rythme</h2>
          <div className="chiffres">
            <div><span className="chiffre">{serie}</span><span className="petit">{serie > 1 ? "jours d’affilée" : "jour d’affilée"}</span></div>
            <div><span className="chiffre">{semaine}</span><span className="petit">{semaine > 1 ? "activités" : "activité"} sur 7 jours</span></div>
            <div><span className="chiffre">{ts.length}</span><span className="petit">en tout</span></div>
          </div>
          <p className="petit">{serie === 0 ? "Une activité aujourd’hui lance votre série." : "Continuez : 20 minutes par jour valent mieux qu’une longue séance par semaine."}</p>
        </section>
      </div>

      <div className="grille-2">
        <section className="carte">
          <h2>Devoirs de votre professeur</h2>
          {!prof && <Vide>Aucun professeur lié. <a href="#/liens">Inviter mon professeur</a></Vide>}
          {prof && aFaire.length === 0 && <Vide>Aucun devoir en attente.</Vide>}
          <ul className="liste">
            {aFaire.map((d) => {
              const a = activite(d.activiteId);
              const retard = d.echeance && d.echeance < auj;
              return a ? (
                <li key={d.id}>
                  <a href={`#/activite/${a.id}?devoir=${d.id}`}>{a.titre}</a> <BadgeComp c={a.competence} /> <Badge>{a.niveau}</Badge>
                  {d.echeance && <span className={`petit ${retard ? "texte-alerte" : ""}`}> · {retard ? "en retard, " : ""}pour le {dateFr(d.echeance)}</span>}
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
          <a href="#/progres" className="lien-fleche">Détail et plan d’amélioration →</a>
        </section>
      </div>

      <section className="carte">
        <h2>Conseillé pour vous</h2>
        {sugg.length === 0 ? (
          <Vide>Vous avez fait toutes les activités de votre niveau. <a href="#/examens-blancs">Passez un examen blanc</a> ou <a href="#/activites">explorez la banque</a>.</Vide>
        ) : (
          <div className="grille-cartes">
            {sugg.map((a) => (
              <a key={a.id} className="mini-carte" href={`#/activite/${a.id}`}>
                <div className="badges"><BadgeComp c={a.competence} /> <Badge>{a.niveau}</Badge></div>
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

const aCorrigerProf = (t: { competence: string; commentaireProf?: string; noteProf?: number; faiteLe: string }) =>
  (t.competence === "PE" || t.competence === "PO") && t.commentaireProf == null && t.noteProf == null && Date.now() - new Date(t.faiteLe).getTime() < 30 * JOUR;

function AccueilProf() {
  const { profil } = useProfil();
  const { data, erreur } = useDonnee(async () => {
    const liens = await backend.liens();
    const eleves = liens.filter((l) => l.statut === "actif" && l.eleveId);
    const [nonLus, details] = await Promise.all([
      backend.nonLus(),
      Promise.all(eleves.map(async (l) => ({ l, ts: l.suspendu ? [] : await backend.tentatives(l.eleveId!), ds: await backend.devoirs(l.eleveId!) }))),
    ]);
    return { liens, details, nonLus };
  }, []);
  const auj = jourLocal();
  const lignes = (data?.details ?? []).map(({ l, ts, ds }) => {
    const derniere = ts[0]?.faiteLe;
    return {
      l,
      nom: l.eleveNom || l.eleveEmail || "",
      aCorriger: ts.filter(aCorrigerProf).length,
      enRetard: ds.filter((d) => d.statut === "a_faire" && d.echeance && d.echeance < auj).length,
      aFaire: ds.filter((d) => d.statut === "a_faire").length,
      derniere,
      inactif: !l.suspendu && (!derniere || Date.now() - new Date(derniere).getTime() > 7 * JOUR),
      semaine: ts.filter((t) => Date.now() - new Date(t.faiteLe).getTime() < 7 * JOUR).length,
      moy: ts.length ? ts.reduce((s, t) => s + taux(t), 0) / ts.length : undefined,
      nonLus: data?.nonLus[l.eleveId!] ?? 0,
    };
  });
  const attente = (data?.liens ?? []).filter((l) => l.statut === "en_attente");
  const alertes: { cle: string; texte: string; href: string; ton: "attention" | "info" }[] = [];
  for (const x of lignes) {
    const id = x.l.eleveId!;
    if (x.l.suspendu) alertes.push({ cle: `s${id}`, texte: `${x.nom} : lien suspendu, l’un des deux accès a expiré.`, href: "#/compte", ton: "attention" });
    if (x.aCorriger) alertes.push({ cle: `c${id}`, texte: `${x.nom} : ${pluriel(x.aCorriger, "production")} à corriger.`, href: `#/eleve/${id}`, ton: "info" });
    if (x.enRetard) alertes.push({ cle: `r${id}`, texte: `${x.nom} : ${pluriel(x.enRetard, "devoir")} en retard.`, href: `#/eleve/${id}`, ton: "attention" });
    if (x.nonLus) alertes.push({ cle: `m${id}`, texte: `${x.nom} : ${pluriel(x.nonLus, "message")} non ${x.nonLus > 1 ? "lus" : "lu"}.`, href: `#/messages/${id}`, ton: "info" });
    if (x.inactif) alertes.push({ cle: `i${id}`, texte: `${x.nom} : aucune activité depuis plus de 7 jours.`, href: `#/eleve/${id}`, ton: "attention" });
  }
  if (attente.length) alertes.push({ cle: "attente", texte: `${pluriel(attente.length, "invitation")} en attente de réponse.`, href: "#/liens", ton: "info" });

  return (
    <div className="pile">
      <div className="titre-ligne">
        <h1>Bonjour {prenom(profil)} !</h1>
        <a className="btn" href="#/liens">Inviter un élève</a>
      </div>
      {erreur && <p className="erreur">{erreur}</p>}
      <section className="carte">
        <h2>À faire</h2>
        {!data ? <p className="petit">Chargement…</p> : alertes.length === 0 ? (
          <Vide>Rien à signaler : aucune production en attente, aucun devoir en retard.</Vide>
        ) : (
          <ul className="alertes">
            {alertes.map((a) => <li key={a.cle} className={a.ton}><a href={a.href}>{a.texte}</a></li>)}
          </ul>
        )}
      </section>
      <section className="carte">
        <h2>Mes élèves</h2>
        {data && lignes.length === 0 ? (
          <Vide>Aucun élève lié pour l’instant. Invitez vos élèves par courriel : ils acceptent, et vous suivez leurs progrès.</Vide>
        ) : (
          <div className="tableau-defile">
            <table className="tableau">
              <thead>
                <tr><th>Élève</th><th>Objectif</th><th>Activités (7 j)</th><th>Réussite moyenne</th><th>À corriger</th><th>Devoirs à faire</th><th>Dernière activité</th></tr>
              </thead>
              <tbody>
                {lignes.map((x) => {
                  const o = x.l.eleveObjectif;
                  const quoi = [EXAMENS.find((e) => e.id === o?.examen)?.nom, o?.niveau].filter(Boolean).join(" ");
                  const j = o?.dateExamen ? joursAvant(o.dateExamen) : null;
                  return (
                    <tr key={x.l.id}>
                      <td>
                        <a href={`#/eleve/${x.l.eleveId}`}><b>{x.nom}</b></a>
                        {x.l.suspendu && <> <Badge ton="attention">suspendu</Badge></>}
                        {x.nonLus > 0 && <> <a href={`#/messages/${x.l.eleveId}`} className="pastille" aria-label={`${x.nonLus} message(s) non lu(s)`}>{x.nonLus}</a></>}
                      </td>
                      <td>{quoi || "—"}{j !== null && j >= 0 && <span className="petit"> · J-{j}</span>}</td>
                      <td>{x.semaine}</td>
                      <td>{x.moy === undefined ? "—" : <span className="cellule-jauge"><Jauge valeur={x.moy} /> {pct(x.moy)}</span>}</td>
                      <td>{x.aCorriger ? <Badge ton="info">{x.aCorriger}</Badge> : "—"}</td>
                      <td>{x.aFaire}{x.enRetard > 0 && <span className="petit texte-alerte"> ({x.enRetard} en retard)</span>}</td>
                      <td>{x.derniere ? dateFr(x.derniere) : "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
