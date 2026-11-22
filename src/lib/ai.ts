import { backend } from "./instance";
import type { SupabaseBackend } from "./supabaseBackend";
import type { CorrectionIA, LangueIA, Niveau, PlanStructure, Profil, Tentative } from "./types";
import { catalogue, niveauCible, planEnTexte, planLocal, validerPlan } from "./plan";
import { reponseLocale } from "./recherche";
import { compterMots, TEST_NIVEAU_ID } from "./util";

/**
 * Accès à l’IA. En production, tous les appels passent par la fonction serveur « ia »
 * (clé API protégée, quota mensuel par abonné). En démonstration ou en cas d’échec,
 * l’application répond avec ses propres ressources : fiches, plan calculé, retour simplifié.
 */

export interface DemandeCorrection {
  consigne: string;
  texte: string;
  niveau: Niveau;
  motsMin?: number;
  examen?: string;
  langue: LangueIA;
}

export interface LienUtile {
  label: string;
  href: string;
}
export type MessageTuteur = { role: "user" | "assistant"; content: string; liens?: LienUtile[] };

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

/** Correction d’une production écrite. */
export async function corriger(d: DemandeCorrection): Promise<CorrectionIA> {
  if (backend.mode === "demo") return correctionDemo(d, "ecrit");
  return appeler<CorrectionIA>({ type: "correction", ...d });
}

/** Retour sur la transcription d’une prise de parole (la prononciation n’est pas évaluée). */
export async function corrigerOral(d: DemandeCorrection): Promise<CorrectionIA> {
  if (backend.mode === "demo") return correctionDemo(d, "oral");
  return appeler<CorrectionIA>({ type: "oral", ...d });
}

/** Tuteur : réponse de l’IA, accompagnée des fiches utiles ; sans IA, réponse tirée des fiches. */
export async function tuteur(historique: MessageTuteur[], langue: LangueIA, niveau?: Niveau): Promise<MessageTuteur> {
  const question = historique[historique.length - 1]?.content ?? "";
  const local = reponseLocale(question, niveau);
  if (backend.mode === "demo")
    return { role: "assistant", content: `Mode démonstration : l’IA n’est pas branchée. ${local.texte}`, liens: local.liens };
  try {
    const r = await appeler<{ texte: string }>({ type: "tuteur", historique: historique.slice(-16).map(({ role, content }) => ({ role, content })), langue, niveau });
    return { role: "assistant", content: r.texte, liens: local.liens };
  } catch (e) {
    return { role: "assistant", content: `L’IA n’a pas pu répondre (${(e as Error).message}). ${local.texte}`, liens: local.liens };
  }
}

/** Plan d’amélioration : rédigé par l’IA quand c’est possible, sinon calculé par l’application. */
export async function planAmelioration(ts: Tentative[], profil: Profil, examenNom?: string): Promise<{ plan: PlanStructure; texte: string; avertissement?: string }> {
  const local = planLocal(ts, profil);
  const utiles = ts.filter((t) => t.activiteId !== TEST_NIVEAU_ID);
  if (backend.mode === "demo" || utiles.length < 3) return local;
  const niveau = niveauCible(ts, profil);
  const resume = utiles.slice(0, 40).map((t) => ({
    activite: t.titre,
    niveau: t.niveau,
    competence: t.competence,
    resultat: `${t.score}/${t.max}`,
    erreurs: t.correction?.erreurs.slice(0, 3).map((e) => e.explication),
    commentaireProf: t.commentaireProf,
  }));
  try {
    const r = await appeler<Omit<PlanStructure, "source">>({
      type: "plan",
      resume,
      catalogue: catalogue(niveau),
      langue: profil.langueIA,
      niveau,
      examen: examenNom,
      dateExamen: profil.dateExamen,
    });
    const plan = validerPlan({ ...r, source: "ia" });
    return { plan, texte: planEnTexte(plan) };
  } catch (e) {
    return { ...local, avertissement: `Plan calculé par l’application : l’IA n’a pas pu répondre (${(e as Error).message}).` };
  }
}

// ───────────── Retours locaux (mode démonstration) ─────────────

const CONNECTEURS = [
  "d’abord", "ensuite", "enfin", "cependant", "pourtant", "néanmoins", "en effet", "par conséquent", "donc",
  "en revanche", "de plus", "par ailleurs", "ainsi", "toutefois", "bien que", "alors que", "puisque", "car", "en conclusion",
  "certes", "d’une part", "d’autre part", "pour conclure", "premièrement", "deuxièmement",
];

/** Longueur indicative d’une prise de parole transcrite, par niveau (en mots). */
const MOTS_ORAL: Record<Niveau, number> = { A1: 40, A2: 80, B1: 150, B2: 300, C1: 450, C2: 550 };

function correctionDemo(d: DemandeCorrection, mode: "ecrit" | "oral"): CorrectionIA {
  const mots = compterMots(d.texte);
  const attendu = mode === "oral" ? MOTS_ORAL[d.niveau] : d.motsMin;
  const bas = d.texte.toLowerCase().replace(/'/g, "’");
  const connecteurs = CONNECTEURS.filter((c) => bas.includes(c));
  const phrases = d.texte.split(/[.!?…]+/).filter((p) => p.trim().length > 0).length;
  const longueurOk = !attendu || mots >= attendu;
  const pLong = longueurOk ? 4 : Math.max(0, Math.round((4 * mots) / (attendu ?? mots)));
  const pCoh = Math.min(5, 1 + connecteurs.length);
  const note = Math.min(20, pLong + pCoh + 4);
  const quoi = mode === "oral" ? "prise de parole" : "texte";
  return {
    niveauEstime: "non évalué (mode démo)",
    note,
    criteres: [
      {
        nom: mode === "oral" ? "Développement de la prise de parole" : "Respect de la consigne et de la longueur",
        points: pLong,
        max: 4,
        commentaire: `${mots} mots${attendu ? ` (${mode === "oral" ? "repère pour ce niveau" : "minimum demandé"} : ${attendu})` : ""}.`,
      },
      { nom: "Cohérence et cohésion", points: pCoh, max: 5, commentaire: connecteurs.length ? `Connecteurs repérés : ${connecteurs.join(", ")}.` : "Aucun connecteur logique repéré : reliez vos idées." },
      { nom: "Langue (grammaire, lexique)", points: 4, max: 11, commentaire: "Évaluation de la langue disponible avec la correction IA (compte requis)." },
    ],
    erreurs: [],
    pointsForts: phrases > 3 ? [`Votre ${quoi} est découpé en plusieurs phrases.`] : [],
    conseils:
      mode === "oral"
        ? [
            "Annoncez votre plan dès le début : l’examinateur suit mieux votre raisonnement.",
            "Réécoutez votre enregistrement et notez trois erreurs à corriger la prochaine fois.",
            "Mode démonstration : cette note est approximative ; la prononciation n’est jamais évaluée sur une transcription.",
          ]
        : [
            "Relisez-vous en trois passages : accords, conjugaisons, puis ponctuation.",
            "Organisez le texte en paragraphes : introduction, développement, conclusion.",
            "Mode démonstration : cette note est approximative et ne juge pas la langue.",
          ],
  };
}
