// Fonction serveur « ia » (Supabase Edge Function, Deno).
// - vérifie la session et l’accès (essai ou abonnement) de l’appelant ;
// - applique un quota mensuel d’appels par abonné (maîtrise du coût) ;
// - appelle Claude avec la clé API gardée côté serveur.
//
// Types de demande : « correction » (production écrite), « oral » (transcription d’une prise de parole),
// « tuteur » (question libre), « plan » (plan d’amélioration structuré, références au contenu de l’application).
//
// Variables à définir : ANTHROPIC_API_KEY, (optionnel) IA_MODELE, IA_QUOTA_MENSUEL.
// SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont fournies par Supabase.

import Anthropic from "npm:@anthropic-ai/sdk";
import { zodOutputFormat } from "npm:@anthropic-ai/sdk/helpers/zod";
import { z } from "npm:zod";
import { createClient } from "npm:@supabase/supabase-js@2";

const MODELE = Deno.env.get("IA_MODELE") ?? "claude-opus-5-5";
const QUOTA = Number(Deno.env.get("IA_QUOTA_MENSUEL") ?? "60");

const anthropic = new Anthropic(); // lit ANTHROPIC_API_KEY
const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (corps: unknown, status = 200) =>
  new Response(JSON.stringify(corps), { status, headers: { ...CORS, "Content-Type": "application/json" } });

const LANGUES: Record<string, string> = {
  fr: "Rédige tes explications en français, clair et adapté au niveau de l’apprenant.",
  es: "Redacta las explicaciones en español. Los ejemplos, citas y correcciones del texto del alumno se mantienen en francés.",
  en: "Write your explanations in English. Keep examples, quotations and corrections of the learner’s text in French.",
  pt: "Escreve as explicações em português. Mantém em francês os exemplos, as citações e as correções do texto do aluno.",
};

const SYSTEME = `Tu es examinateur-correcteur habilité pour les examens de français langue étrangère (DELF, DALF, TCF, TCF Québec, TEF, Ev@lang, diplômes de français professionnel de la CCI Paris Île-de-France, Certificat Voltaire) et professeur de FLE expérimenté.
Principes :
- tu évalues selon les descripteurs du CECRL et les grilles de l’examen visé, sans complaisance ni sévérité excessive ;
- tu cites les passages exacts de l’apprenant et tu expliques chaque correction par la règle en jeu ;
- tu respectes la typographie française (espace insécable avant ; : ! ?, guillemets « ») ;
- tu ne présentes jamais une note comme officielle : elle est indicative ;
- si le texte ne répond pas à la consigne, tu le dis clairement.`;

const Correction = z.object({
  niveauEstime: z.string().describe("Niveau CECRL estimé, par exemple « B1 » ou « B1+ »"),
  note: z.number().describe("Note indicative sur 20"),
  criteres: z.array(z.object({ nom: z.string(), points: z.number(), max: z.number(), commentaire: z.string() })),
  erreurs: z.array(z.object({ extrait: z.string(), correction: z.string(), explication: z.string() })),
  pointsForts: z.array(z.string()),
  conseils: z.array(z.string()),
});

const Plan = z.object({
  diagnostic: z.string().describe("Trois phrases : forces, faiblesses prioritaires, niveau de travail"),
  priorites: z.array(z.object({
    competence: z.enum(["CO", "CE", "PE", "PO", "LS"]),
    constat: z.string(),
    objectif: z.string(),
  })).describe("Deux compétences prioritaires au plus"),
  etapes: z.array(z.object({
    titre: z.string(),
    taches: z.array(z.object({
      texte: z.string(),
      ref: z.string().describe("Référence exacte prise dans le catalogue (par exemple « activite:b1-ls-relatifs »), ou chaîne vide"),
    })),
  })),
  indicateurs: z.array(z.string()).describe("Trois indicateurs mesurables"),
});

async function appelerClaude(params: { messages: Anthropic.MessageParam[]; effort: "low" | "medium" | "high"; format?: unknown }) {
  // `fallbacks: "default"` : si une requête est déclinée par un filtre de sécurité,
  // l’API la relance sur un modèle de repli adapté au lieu de s’arrêter.
  const r = await anthropic.beta.messages.create({
    model: MODELE,
    max_tokens: 16000,
    system: SYSTEME,
    messages: params.messages,
    output_config: params.format ? { effort: params.effort, format: params.format } : { effort: params.effort },
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
  } as never);
  const rep = r as unknown as Anthropic.Beta.BetaMessage;
  if (rep.stop_reason === "refusal") throw new Error("La demande n’a pas pu être traitée. Reformulez votre texte.");
  return rep.content.flatMap((b) => (b.type === "text" ? [b.text] : [])).join("");
}

const CONSIGNE_CORRECTION = `Rends : le niveau estimé ; une note indicative sur 20 ; 4 ou 5 critères avec points, maximum et commentaire ; les erreurs les plus importantes (au plus 12) avec l’extrait exact, la correction et la règle ; 2 à 4 points forts ; 3 à 5 conseils concrets pour progresser.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  try {
    const jeton = req.headers.get("Authorization")?.replace("Bearer ", "");
    const { data: u } = await admin.auth.getUser(jeton ?? "");
    if (!u.user) return json({ erreur: "Connectez-vous pour utiliser l’IA." }, 401);

    const { data: p } = await admin.from("profils").select("*").eq("id", u.user.id).single();
    if (!p || p.abonnement === "expire" || new Date(p.abonnement_fin) < new Date())
      return json({ erreur: "Votre accès n’est pas actif : activez un code dans « Mon compte »." }, 402);

    const mois = new Date().toISOString().slice(0, 7);
    const { data: usage } = await admin.from("usage_ia").select("appels").eq("user_id", p.id).eq("mois", mois).maybeSingle();
    const appels = usage?.appels ?? 0;
    if (appels >= QUOTA) return json({ erreur: `Quota mensuel d’IA atteint (${QUOTA} demandes). Il se renouvelle le 1er du mois.` }, 429);

    const corps = await req.json();
    const langue = LANGUES[corps.langue] ?? LANGUES.fr;
    const texte = String(corps.texte ?? "").slice(0, 12000);
    let resultat: unknown;

    if (corps.type === "correction") {
      const brut = await appelerClaude({
        effort: "medium",
        format: zodOutputFormat(Correction),
        messages: [{
          role: "user",
          content: `${langue}
Corrige cette production écrite.
Examen visé : ${corps.examen ?? "non précisé"} — niveau visé : ${corps.niveau}.
Consigne donnée à l’apprenant : « ${corps.consigne} »${corps.motsMin ? ` (au moins ${corps.motsMin} mots)` : ""}.

Production de l’apprenant :
<<<
${texte}
>>>

Critères : adéquation à la consigne, cohérence et cohésion, lexique, morphosyntaxe, orthographe. ${CONSIGNE_CORRECTION}`,
        }],
      });
      resultat = Correction.parse(JSON.parse(brut));
    } else if (corps.type === "oral") {
      const brut = await appelerClaude({
        effort: "medium",
        format: zodOutputFormat(Correction),
        messages: [{
          role: "user",
          content: `${langue}
Voici la transcription automatique d’une prise de parole d’un apprenant (épreuve de production orale).
Examen visé : ${corps.examen ?? "non précisé"} — niveau visé : ${corps.niveau}.
Consigne : « ${corps.consigne} ».

Transcription (elle peut contenir des erreurs de reconnaissance vocale : n’en tiens pas compte, ni de la ponctuation) :
<<<
${texte}
>>>

Évalue ce qui est observable dans une transcription : réalisation de la tâche, organisation du discours (plan, connecteurs), richesse et précision du lexique, correction grammaticale. Dis explicitement que la prononciation et la fluidité ne peuvent pas être évaluées à partir d’un texte. ${CONSIGNE_CORRECTION}`,
        }],
      });
      resultat = Correction.parse(JSON.parse(brut));
    } else if (corps.type === "tuteur") {
      const historique = (corps.historique ?? []).slice(-16) as Anthropic.MessageParam[];
      historique[historique.length - 1] = {
        role: "user",
        content: `${langue} Niveau de l’apprenant : ${corps.niveau ?? "inconnu"}. Réponds en tuteur : bref, précis, avec un exemple, et termine par une petite question de vérification.\n\n${historique.at(-1)?.content ?? ""}`,
      };
      resultat = { texte: await appelerClaude({ effort: "low", messages: historique }) };
    } else if (corps.type === "plan") {
      const brut = await appelerClaude({
        effort: "medium",
        format: zodOutputFormat(Plan),
        messages: [{
          role: "user",
          content: `${langue}
Voici les derniers résultats d’un apprenant (examen visé : ${corps.examen ?? "non précisé"}, niveau de travail : ${corps.niveau ?? "non précisé"}${corps.dateExamen ? `, date d’examen : ${corps.dateExamen}` : ""}) :
${JSON.stringify(corps.resume).slice(0, 15000)}

Catalogue des contenus disponibles dans l’application pour ce niveau (chaque élément a une référence « ref ») :
${JSON.stringify(corps.catalogue).slice(0, 20000)}

Rédige un plan d’amélioration sur deux semaines : un diagnostic, au plus deux compétences prioritaires (constat chiffré et objectif mesurable), deux étapes (« Semaine 1 », « Semaine 2 ») de 3 à 5 tâches chacune, et trois indicateurs de progrès. Pour chaque tâche qui renvoie à un contenu, recopie exactement sa référence du catalogue dans « ref » ; sinon, laisse « ref » vide. N’invente aucune référence.`,
        }],
      });
      const plan = Plan.parse(JSON.parse(brut));
      resultat = { ...plan, etapes: plan.etapes.map((e) => ({ ...e, taches: e.taches.map((t) => (t.ref ? t : { texte: t.texte })) })) };
    } else {
      return json({ erreur: "Type de demande inconnu." }, 400);
    }

    await admin.from("usage_ia").upsert({ user_id: p.id, mois, appels: appels + 1 });
    return json(resultat);
  } catch (e) {
    console.error(e);
    return json({ erreur: e instanceof Error ? e.message : "Erreur du service d’IA." }, 500);
  }
});
