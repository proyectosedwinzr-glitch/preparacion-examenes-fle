import { useCallback, useEffect, useRef, useState } from "react";
import { backend } from "./lib/instance";
import { AppCtx, useDonnee, useProfil, useRoute } from "./lib/hooks";
import type { Profil } from "./lib/types";
import { abonnementValide } from "./lib/backend";
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
import ExamensBlancs from "./pages/ExamensBlancs";
import Revisions from "./pages/Revisions";
import TestNiveau from "./pages/TestNiveau";
import Legal from "./pages/Legal";

type Onglet = { chemin: string; label: string; icone: string; mobile?: boolean; court?: string; pastille?: number };

function ongletsPour(p: Profil, nonLus: number): Onglet[] {
  return p.role === "eleve"
    ? [
        { chemin: "", label: "Accueil", icone: "⌂", mobile: true },
        { chemin: "examens", label: "Examens", icone: "▤" },
        { chemin: "niveaux", label: "Niveaux", icone: "◔" },
        { chemin: "revisions", label: "Révisions", icone: "❖" },
        { chemin: "activites", label: "Activités", icone: "✎", mobile: true },
        { chemin: "examens-blancs", label: "Examens blancs", icone: "⏱" },
        { chemin: "progres", label: "Progrès", icone: "↗", mobile: true },
        { chemin: "tuteur", label: "Tuteur", icone: "✦" },
        { chemin: "liens", label: "Mon professeur", icone: "☺", mobile: true, court: "Professeur", pastille: nonLus },
      ]
    : [
        { chemin: "", label: "Mes élèves", icone: "⌂", mobile: true, court: "Élèves" },
        { chemin: "activites", label: "Activités", icone: "✎", mobile: true },
        { chemin: "niveaux", label: "Niveaux et fiches", icone: "◔", court: "Niveaux" },
        { chemin: "revisions", label: "Révisions", icone: "❖" },
        { chemin: "examens", label: "Examens", icone: "▤" },
        { chemin: "examens-blancs", label: "Examens blancs", icone: "⏱" },
        { chemin: "liens", label: "Invitations", icone: "☺", mobile: true },
        { chemin: "messages", label: "Messages", icone: "✉", mobile: true, pastille: nonLus },
      ];
}

type Theme = readonly [string, (t: string) => void];

function useTheme(): Theme {
  const [theme, setTheme] = useState<string>(() => {
    try {
      return localStorage.getItem("tremplin-theme") ?? "auto";
    } catch {
      return "auto";
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem("tremplin-theme", theme);
    } catch {
      /* stockage indisponible */
    }
    document.documentElement.dataset.theme = theme;
  }, [theme]);
  return [theme, setTheme] as const;
}

export default function App() {
  const [profil, setProfil] = useState<Profil | null | undefined>(undefined);
  const theme = useTheme();
  const { segments } = useRoute();

  useEffect(() => {
    const charger = () => backend.profilCourant().then(setProfil).catch(() => setProfil(null));
    charger();
    return backend.onChange(charger);
  }, []);

  if (profil === undefined) return <div className="chargement">Chargement…</div>;
  if (!profil)
    return segments[0] === "legal" ? (
      <main className="contenu"><Legal page={segments[1]} /></main>
    ) : (
      <Connexion />
    );
  return (
    <AppCtx.Provider value={{ profil, setProfil }}>
      <Coquille theme={theme} segments={segments} />
    </AppCtx.Provider>
  );
}

function Pastille({ n }: { n?: number }) {
  return n ? <span className="pastille" aria-label={`${n} non lu${n > 1 ? "s" : ""}`}>{n}</span> : null;
}

function Coquille({ theme: [theme, setTheme], segments }: { theme: Theme; segments: string[] }) {
  const { profil } = useProfil();
  const { data: parPersonne } = useDonnee(() => backend.nonLus().catch(() => ({}) as Record<string, number>), [profil.id]);
  const nonLus = Object.values(parPersonne ?? {}).reduce((a, b) => a + b, 0);
  const onglets = ongletsPour(profil, nonLus);
  const [plus, setPlus] = useState(false);
  const fermerPlus = useCallback(() => setPlus(false), []);
  const main = useRef<HTMLElement>(null);
  const [s0, s1] = segments;
  const actif = s0 ?? "";
  useEffect(() => setPlus(false), [s0, s1]);
  // Fragment d’URL inattendu (par exemple au retour d’un lien de connexion) : retour à l’accueil.
  useEffect(() => {
    if (actif.includes("=")) window.location.replace("#/");
  }, [actif]);

  const page = (() => {
    switch (s0) {
      case undefined: return <Accueil />;
      case "examens": return <Examens key={s1} id={s1} />;
      case "niveaux": return <Niveaux key={s1} niveau={s1} />;
      case "fiche": return <Niveaux key={s1} fiche={s1} />;
      case "revisions": return <Revisions key={s1} id={s1} />;
      case "activites": return <Activites />;
      case "activite": return <Exercice key={s1} id={s1} />;
      case "examens-blancs": return <ExamensBlancs key={s1} id={s1} />;
      case "test-niveau": return <TestNiveau />;
      case "progres": return <Progres eleveId={profil.id} />;
      case "tuteur": return <Tuteur />;
      case "liens": return <Liens />;
      case "messages": return <Messages key={s1} avec={s1} />;
      case "compte": return <Compte />;
      case "eleve": return <EleveDetail key={s1} id={s1} />;
      case "legal": return <Legal page={s1} />;
      default:
        return actif.includes("=") ? <Accueil /> : <p>Page introuvable. <a href="#/">Retour à l’accueil</a></p>;
    }
  })();

  const changerTheme = () => setTheme(theme === "sombre" ? "clair" : theme === "clair" ? "auto" : "sombre");
  const nomTheme = theme === "sombre" ? "sombre" : theme === "clair" ? "clair" : "automatique";

  return (
    <>
      <a className="saut" href="#/" onClick={(e) => { e.preventDefault(); main.current?.focus(); }}>Aller au contenu</a>
      <header className="entete">
        <a href="#/" className="marque">
          <span className="logo" aria-hidden>T</span>
          <span>Tremplin <b>FLE</b></span>
        </a>
        <nav className="nav-haut" aria-label="Navigation principale">
          {onglets.map((o) => (
            <a key={o.chemin} href={`#/${o.chemin}`} aria-current={actif === o.chemin ? "page" : undefined}>
              {o.label}
              <Pastille n={o.pastille} />
            </a>
          ))}
        </nav>
        <div className="outils">
          <button className="btn-icone" title={`Thème ${nomTheme}`} aria-label={`Thème ${nomTheme} : changer`} onClick={changerTheme}>
            {theme === "sombre" ? "☾" : theme === "clair" ? "☀" : "◐"}
          </button>
          <a href="#/compte" className="avatar" title="Mon compte" aria-label="Mon compte">
            {(profil.nom || profil.email).slice(0, 1).toUpperCase()}
          </a>
        </div>
      </header>
      {backend.mode === "demo" && (
        <div className="bandeau-demo">Mode démonstration : les données restent dans ce navigateur et l’IA n’est pas branchée.</div>
      )}
      {!abonnementValide(profil) && (
        <div className="bandeau-alerte">
          Votre accès a expiré : vos résultats ne sont plus enregistrés et le lien avec {profil.role === "eleve" ? "votre professeur" : "vos élèves"} est suspendu.{" "}
          <a href="#/compte">Activer un code ou renouveler</a>
        </div>
      )}
      <main id="contenu" className="contenu" ref={main} tabIndex={-1}>{page}</main>
      <nav className="nav-bas" aria-label="Navigation mobile">
        {onglets.filter((o) => o.mobile).map((o) => (
          <a key={o.chemin} href={`#/${o.chemin}`} aria-current={actif === o.chemin ? "page" : undefined}>
            <span aria-hidden>{o.icone}</span>
            {o.court ?? o.label}
            <Pastille n={o.pastille} />
          </a>
        ))}
        <button type="button" onClick={() => setPlus(true)} aria-haspopup="dialog" aria-expanded={plus}>
          <span aria-hidden>☰</span>Plus
        </button>
      </nav>
      {plus && <MenuPlus onglets={onglets} actif={actif} fermer={fermerPlus} changerTheme={changerTheme} nomTheme={nomTheme} />}
    </>
  );
}

function MenuPlus({ onglets, actif, fermer, changerTheme, nomTheme }: { onglets: Onglet[]; actif: string; fermer: () => void; changerTheme: () => void; nomTheme: string }) {
  const premier = useRef<HTMLAnchorElement>(null);
  useEffect(() => {
    premier.current?.focus();
    const f = (e: KeyboardEvent) => e.key === "Escape" && fermer();
    window.addEventListener("keydown", f);
    return () => window.removeEventListener("keydown", f);
  }, [fermer]);
  return (
    <div className="feuille-fond" onClick={fermer}>
      <div className="feuille" role="dialog" aria-modal="true" aria-label="Toutes les rubriques" onClick={(e) => e.stopPropagation()}>
        <div className="feuille-tete">
          <b>Toutes les rubriques</b>
          <button className="btn-icone" onClick={fermer} aria-label="Fermer">✕</button>
        </div>
        <nav className="feuille-liens">
          {onglets.map((o, i) => (
            <a key={o.chemin} ref={i === 0 ? premier : undefined} href={`#/${o.chemin}`} aria-current={actif === o.chemin ? "page" : undefined}>
              <span aria-hidden>{o.icone}</span>
              {o.label}
              <Pastille n={o.pastille} />
            </a>
          ))}
          <a href="#/compte" aria-current={actif === "compte" ? "page" : undefined}><span aria-hidden>⚙</span>Mon compte</a>
          <a href="#/legal" aria-current={actif === "legal" ? "page" : undefined}><span aria-hidden>§</span>Conditions et confidentialité</a>
        </nav>
        <button className="btn secondaire" onClick={changerTheme}>Thème : {nomTheme}</button>
      </div>
    </div>
  );
}
