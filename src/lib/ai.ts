import { backend } from "./instance";
import type { SupabaseBackend } from "./supabaseBackend";
import type { CorrectionIA, LangueIA, Niveau, Tentative } from "./types";

/**
 * Accès à l’IA. En production, tous les appels passent par la fonction serveur « ia »
 * (clé API protégée, quota mensuel par abonné). En démonstration, un retour local
 * minimal est produit pour que le parcours reste testable.
 */

export interface DemandeCorrection {
  consigne: string;
  texte: string;
  niveau: Niveau;
  motsMin?: number;
  examen?: string;
  langue: LangueIA;
}

export type MessageTuteur = { role: "user" | "assistant"; content: string };

async function appeler<T>(corps: Record<string, unknown>): Promise<T> {
  if (backend.mode !== "supabase") throw new Error("demo");
  const { data, error } = await (backend as SupabaseBackend).client.functions.invoke("ia", { body: corps });
  if (error) {
    let msg = error.message;
    try {
      const ctx = (error as { context?: Response }).context;
      if (ctx) msg = (await ctx.json()).erreur ?? msg;
    } catch {
      /* corps illisible : on garde le message générique */
    }
    throw new Error(msg);
  }
  return data as T;
}

export async function corriger(d: DemandeCorrection): Promise<CorrectionIA> {
  if (backend.mode === "demo") return correctionDemo(d);
  return appeler<CorrectionIA>({ type: "correction", ...d });
}

export async function tuteur(historique: MessageTuteur[], langue: LangueIA, niveau?: Niveau): Promise<string> {
  if (backend.mode === "demo")
    return "Mode démonstration : le tuteur IA sera disponible avec un compte. En attendant, consultez les fiches du niveau visé et la rubrique « Conseils » de votre examen.";
  const r = await appeler<{ texte: string }>({ type: "tuteur", historique, langue, niveau });
  return r.texte;
}

export async function planAmelioration(tentatives: Tentative[], langue: LangueIA, niveau?: Niveau, examen?: string): Promise<string> {
  const resume = tentatives.slice(0, 40).map((t) => ({
    activite: t.titre,
    niveau: t.niveau,
    competence: t.competence,
    resultat: `${t.score}/${t.max}`,
    erreurs: t.correction?.erreurs.slice(0, 3).map((e) => e.explication),
    commentaireProf: t.commentaireProf,
  }));
  if (backend.mode === "demo") return planDemo(tentatives);
  const r = await appeler<{ texte: string }>({ type: "plan", resume, langue, niveau, examen });
  return r.texte;
}

// ───────────── Retours locaux du mode démonstration ─────────────

const CONNECTEURS = [
  "d’abord", "ensuite", "enfin", "cependant", "pourtant", "néanmoins", "en effet", "par conséquent", "donc",
  "en revanche", "de plus", "par ailleurs", "ainsi", "toutefois", "bien que", "alors que", "puisque", "car", "en conclusion",
];

function correctionDemo(d: DemandeCorrection): CorrectionIA {
  const mots = d.texte.trim().split(/\s+/).filter(Boolean).length;
  const bas = d.texte.toLowerCase().replace(/'/g, "’");
  const connecteurs = CONNECTEURS.filter((c) => bas.includes(c));
  const phrases = d.texte.split(/[.!?…]+/).filter((p) => p.trim().length > 0).length;
  const longueurOk = !d.motsMin || mots >= d.motsMin;
  const pLong = longueurOk ? 4 : Math.round((4 * mots) / (d.motsMin ?? mots));
  const pCoh = Math.min(5, 1 + connecteurs.length);
  const note = Math.min(20, pLong + pCoh + 4);
  return {
    niveauEstime: "non évalué (mode démo)",
    note,
    criteres: [
      { nom: "Respect de la consigne et de la longueur", points: pLong, max: 4, commentaire: `${mots} mots${d.motsMin ? ` (minimum demandé : ${d.motsMin})` : ""}.` },
      { nom: "Cohérence et cohésion", points: pCoh, max: 5, commentaire: connecteurs.length ? `Connecteurs repérés : ${connecteurs.join(", ")}.` : "Aucun connecteur logique repéré : reliez vos idées." },
      { nom: "Langue (grammaire, lexique, orthographe)", points: 4, max: 11, commentaire: "Évaluation de la langue disponible avec la correction IA (compte requis)." },
    ],
    erreurs: [],
    pointsForts: phrases > 3 ? ["Le texte est découpé en plusieurs phrases."] : [],
    conseils: [
      "Relisez-vous en trois passages : accords, conjugaisons, puis ponctuation.",
      "Organisez le texte en paragraphes : introduction, développement, conclusion.",
      "Mode démonstration : cette note est approximative et ne juge pas la langue.",
    ],
  };
}

function planDemo(t: Tentative[]): string {
  if (!t.length) return "Faites d’abord quelques activités : le plan s’appuie sur vos résultats.";
  const parComp = new Map<string, number[]>();
  for (const x of t) parComp.set(x.competence, [...(parComp.get(x.competence) ?? []), x.score / x.max]);
  const tri = [...parComp.entries()].map(([c, v]) => [c, v.reduce((a, b) => a + b, 0) / v.length] as const).sort((a, b) => a[1] - b[1]);
  const faible = tri[0];
  return [
    `Plan indicatif (mode démo, sans IA)`,
    ``,
    `Compétence à travailler en priorité : ${faible[0]} (réussite moyenne ${Math.round(faible[1] * 100)} %).`,
    ``,
    `Semaine 1 : une activité de ${faible[0]} par jour, relecture des corrigés, fiche du niveau correspondante.`,
    `Semaine 2 : alterner ${faible[0]} et la compétence suivante (${tri[1]?.[0] ?? "au choix"}), puis refaire les activités échouées.`,
  ].join("\n");
}
