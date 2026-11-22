import { useState } from "react";
import { backend } from "../lib/instance";
import type { Role } from "../lib/types";

/** Erreur renvoyée par un lien de connexion expiré ou déjà utilisé (dans l’adresse de la page). */
function erreurDansAdresse(): string {
  const brut = window.location.hash.replace(/^#\/?/, "") + "&" + window.location.search.slice(1);
  const p = new URLSearchParams(brut);
  const code = p.get("error_code");
  if (code === "otp_expired") return "Ce lien de connexion a expiré ou a déjà servi. Demandez-en un nouveau ci-dessous.";
  const d = p.get("error_description");
  return d ? `Connexion impossible : ${d.replace(/\+/g, " ")}` : "";
}

export default function Connexion() {
  const [email, setEmail] = useState("");
  const [nom, setNom] = useState("");
  const [role, setRole] = useState<Role>("eleve");
  const [etat, setEtat] = useState<"saisie" | "envoi" | "envoye">("saisie");
  const [erreur, setErreur] = useState(erreurDansAdresse);

  async function valider(e: React.FormEvent) {
    e.preventDefault();
    setErreur("");
    if (!/^\S+@\S+\.\S+$/.test(email)) return setErreur("Saisissez une adresse électronique valide.");
    setEtat("envoi");
    try {
      const r = await backend.connexion(email, role, nom);
      setEtat(r.lienEnvoye ? "envoye" : "saisie");
    } catch (x) {
      setErreur((x as Error).message);
      setEtat("saisie");
    }
  }

  return (
    <div className="connexion">
      <section className="connexion-intro">
        <div className="marque grande"><span className="logo">T</span><span>Tremplin <b>FLE</b></span></div>
        <h1>Préparez votre examen de français, en autonomie et avec votre professeur.</h1>
        <ul className="liste-atouts">
          <li><b>8 examens expliqués</b> : DELF, DALF, TCF, TCF Québec, TEF, Ev@lang, DFP, Certificat Voltaire.</li>
          <li><b>Fiches, révisions et activités</b> de A1 à C2, avec corrigés expliqués, test de niveau et examens blancs notés sur 100.</li>
          <li><b>Retours de l’IA</b> sur vos productions écrites et orales, et plan d’amélioration personnalisé.</li>
          <li><b>Lien élève–professeur</b> par courriel : vous voyez tous les deux les mêmes progrès, sans commission sur vos cours.</li>
        </ul>
      </section>

      <form className="carte connexion-form" onSubmit={valider}>
        {etat === "envoye" ? (
          <>
            <h2>Vérifiez votre boîte de réception</h2>
            <p>Nous avons envoyé un lien de connexion à <b>{email}</b>. Ouvrez-le sur cet appareil, dans ce navigateur, pour accéder à votre espace.</p>
            <p className="petit">Rien reçu ? Regardez dans les courriers indésirables, puis réessayez dans une minute.</p>
            <button type="button" className="btn secondaire" onClick={() => setEtat("saisie")}>Utiliser une autre adresse</button>
          </>
        ) : (
          <>
            <h2>Connexion ou inscription</h2>
            <fieldset className="choix-role">
              <legend>Je suis…</legend>
              <label className={role === "eleve" ? "actif" : ""}>
                <input type="radio" name="role" checked={role === "eleve"} onChange={() => setRole("eleve")} />
                <b>Élève</b><span>Je prépare un examen</span>
              </label>
              <label className={role === "professeur" ? "actif" : ""}>
                <input type="radio" name="role" checked={role === "professeur"} onChange={() => setRole("professeur")} />
                <b>Professeur</b><span>J’accompagne des élèves</span>
              </label>
            </fieldset>
            <label className="champ">Prénom et nom
              <input value={nom} onChange={(e) => setNom(e.target.value)} autoComplete="name" placeholder="Lucía Gómez" />
            </label>
            <label className="champ">Adresse électronique
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" placeholder="vous@exemple.com" />
            </label>
            {erreur && <p className="erreur" role="alert">{erreur}</p>}
            <button className="btn" disabled={etat === "envoi"}>{backend.mode === "demo" ? "Entrer" : "Recevoir mon lien de connexion"}</button>
            <p className="petit">
              {backend.mode === "demo"
                ? "Mode démonstration : aucun courriel n’est envoyé. Vous pouvez créer un compte élève puis un compte professeur dans ce même navigateur pour tester le lien entre les deux."
                : "Pas de mot de passe : un lien sécurisé vous est envoyé par courriel. Le rôle n’est pris en compte qu’à la première inscription. Essai gratuit de 14 jours."}
            </p>
            <p className="petit">En continuant, vous acceptez les <a href="#/legal/conditions">conditions d’utilisation</a> et la <a href="#/legal/confidentialite">politique de confidentialité</a>.</p>
          </>
        )}
      </form>
    </div>
  );
}
