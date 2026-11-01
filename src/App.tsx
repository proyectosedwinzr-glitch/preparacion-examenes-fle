import { useEffect, useState } from "react";
import { backend } from "./lib/instance";
import { AppCtx, useRoute } from "./lib/hooks";
import type { Profil } from "./lib/types";
import Connexion from "./pages/Connexion";
import Accueil from "./pages/Accueil";
import Examens from "./pages/Examens";
import Niveaux from "./pages/Niveaux";
import Activites from "./pages/Activites";
import Exercice from "./pages/Exercice";
import Progres from "./pages/Progres";
import Tuteur from "./pages/Tuteur";
import Liens from "./pages/Liens";
import Messages from "./pages/Messages";
import Compte from "./pages/Compte";
import EleveDetail from "./pages/EleveDetail";
import { abonnementValide } from "./lib/backend";

type Onglet = { chemin: string; label: string; icone: string; mobile?: boolean; court?: string };

const ONGLETS_ELEVE: Onglet[] = [
  { chemin: "", label: "Accueil", icone: "⌂", mobile: true },
  { chemin: "examens", label: "Examens", icone: "▤" },
  { chemin: "niveaux", label: "Niveaux", icone: "◔", mobile: true },
  { chemin: "activites", label: "Activités", icone: "✎", mobile: true },
  { chemin: "progres", label: "Progrès", icone: "↗", mobile: true },
  { chemin: "tuteur", label: "Tuteur IA", icone: "✦" },
  { chemin: "liens", label: "Mon professeur", icone: "☺", mobile: true, court: "Professeur" },
];
const ONGLETS_PROF: Onglet[] = [
  { chemin: "", label: "Mes élèves", icone: "⌂", mobile: true, court: "Élèves" },
  { chemin: "activites", label: "Banque d’activités", icone: "✎", mobile: true, court: "Activités" },
  { chemin: "niveaux", label: "Niveaux et fiches", icone: "◔", mobile: true, court: "Niveaux" },
  { chemin: "examens", label: "Examens", icone: "▤" },
  { chemin: "liens", label: "Invitations", icone: "☺", mobile: true },
  { chemin: "messages", label: "Messages", icone: "✉", mobile: true },
];

function useTheme() {
  const [theme, setTheme] = useState<string>(() => localStorage.getItem("tremplin-theme") ?? "auto");
  useEffect(() => {
    localStorage.setItem("tremplin-theme", theme);
    document.documentElement.dataset.theme = theme;
  }, [theme]);
  return [theme, setTheme] as const;
}

export default function App() {
  const [profil, setProfil] = useState<Profil | null | undefined>(undefined);
  const [theme, setTheme] = useTheme();
  const { segments } = useRoute();

  useEffect(() => {
    const charger = () => backend.profilCourant().then(setProfil);
    charger();
    return backend.onChange(charger);
  }, []);

  if (profil === undefined) return <div className="chargement">Chargement…</div>;
  if (!profil) return <Connexion />;

  const onglets = profil.role === "eleve" ? ONGLETS_ELEVE : ONGLETS_PROF;
  const actif = segments[0] ?? "";
  const page = (() => {
    const [s0, s1] = segments;
    switch (s0) {
      case undefined: return <Accueil />;
      case "examens": return <Examens id={s1} />;
      case "niveaux": return <Niveaux niveau={s1} />;
      case "fiche": return <Niveaux fiche={s1} />;
      case "activites": return <Activites />;
      case "activite": return <Exercice id={s1} />;
      case "progres": return <Progres eleveId={profil.id} />;
      case "tuteur": return <Tuteur />;
      case "liens": return <Liens />;
      case "messages": return <Messages avec={s1} />;
      case "compte": return <Compte />;
      case "eleve": return <EleveDetail id={s1} />;
      default: return <p>Page introuvable. <a href="#/">Retour à l’accueil</a></p>;
    }
  })();

  return (
    <AppCtx.Provider value={{ profil, setProfil }}>
      <a className="saut" href="#contenu">Aller au contenu</a>
      <header className="entete">
        <a href="#/" className="marque">
          <span className="logo" aria-hidden>T</span>
          <span>Tremplin <b>FLE</b></span>
        </a>
        <nav className="nav-haut" aria-label="Navigation principale">
          {onglets.map((o) => (
            <a key={o.chemin} href={`#/${o.chemin}`} aria-current={actif === o.chemin ? "page" : undefined}>
              {o.label}
            </a>
          ))}
        </nav>
        <div className="outils">
          <button className="btn-icone" title="Changer de thème" aria-label="Changer de thème"
            onClick={() => setTheme(theme === "sombre" ? "clair" : theme === "clair" ? "auto" : "sombre")}>
            {theme === "sombre" ? "☾" : theme === "clair" ? "☀" : "◐"}
          </button>
          <a href="#/compte" className="avatar" title="Mon compte" aria-label="Mon compte">
            {(profil.nom || profil.email).slice(0, 1).toUpperCase()}
          </a>
        </div>
      </header>
      {backend.mode === "demo" && (
        <div className="bandeau-demo">
          Mode démonstration : les données restent dans ce navigateur et l’IA n’est pas branchée.
        </div>
      )}
      {!abonnementValide(profil) && (
        <div className="bandeau-alerte">
          Votre accès a expiré. <a href="#/compte">Renouveler l’abonnement</a> pour continuer à enregistrer vos progrès et rester lié.
        </div>
      )}
      <main id="contenu" className="contenu">{page}</main>
      <nav className="nav-bas" aria-label="Navigation mobile">
        {onglets.filter((o) => o.mobile).map((o) => (
          <a key={o.chemin} href={`#/${o.chemin}`} aria-current={actif === o.chemin ? "page" : undefined}>
            <span aria-hidden>{o.icone}</span>
            {o.court ?? o.label}
          </a>
        ))}
      </nav>
    </AppCtx.Provider>
  );
}
