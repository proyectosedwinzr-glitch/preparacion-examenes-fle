import type { Niveau } from "../lib/types";

/** Test de positionnement : 4 questions par niveau, de A1 à C2, présentées par difficulté croissante. */
export interface ItemTest {
  niveau: Niveau;
  /** Court document à lire avant la question (facultatif). */
  support?: string;
  q: string;
  options: string[];
  /** Index de la bonne réponse dans `options` (les options sont mélangées à l’affichage). */
  bonne: number;
  explication: string;
}

export const TEST_NIVEAU: ItemTest[] = [
  // A1
  { niveau: "A1", q: "Je ___ étudiante en médecine.", options: ["suis", "ai", "es"], bonne: 0, explication: "Profession : verbe être, je suis." },
  { niveau: "A1", q: "— Tu as quel âge ? — J’___ vingt ans.", options: ["ai", "suis", "a"], bonne: 0, explication: "L’âge se dit avec avoir : j’ai vingt ans." },
  { niveau: "A1", q: "Elle habite ___ Bogotá.", options: ["à", "en", "au"], bonne: 0, explication: "Devant un nom de ville : à." },
  { niveau: "A1", support: "Boulangerie Dupont — Ouvert du mardi au dimanche, de 7 h à 19 h.", q: "Le lundi, la boulangerie est…", options: ["fermée", "ouverte le matin", "ouverte jusqu’à 19 h"], bonne: 0, explication: "Elle ouvre du mardi au dimanche : le lundi, elle est fermée." },
  // A2
  { niveau: "A2", q: "Hier soir, nous ___ au restaurant.", options: ["sommes allés", "avons allé", "allons"], bonne: 0, explication: "Aller se conjugue avec être au passé composé." },
  { niveau: "A2", q: "Mon frère est ___ grand que moi.", options: ["plus", "plus de", "le plus"], bonne: 0, explication: "Comparatif devant un adjectif : plus… que." },
  { niveau: "A2", q: "— Tu as écrit à Marie ? — Oui, je ___ ai écrit hier.", options: ["lui", "la", "leur"], bonne: 0, explication: "Écrire à quelqu’un : complément indirect singulier → lui." },
  { niveau: "A2", support: "Message de Paul : « Désolé, mon train a du retard. Je ne peux pas être là à 18 h. On se retrouve à 19 h au café ? »", q: "Pourquoi Paul écrit-il ?", options: ["Pour changer l’heure du rendez-vous", "Pour annuler le rendez-vous", "Pour réserver un train"], bonne: 0, explication: "Il propose 19 h au lieu de 18 h." },
  // B1
  { niveau: "B1", q: "C’est un sujet ___ on parle beaucoup en ce moment.", options: ["dont", "que", "où"], bonne: 0, explication: "Parler de quelque chose : dont." },
  { niveau: "B1", q: "Quand j’étais petit, j’___ souvent chez mes grands-parents.", options: ["allais", "suis allé", "irai"], bonne: 0, explication: "Habitude dans le passé : imparfait." },
  { niveau: "B1", q: "Si j’avais plus de temps, j’___ le piano.", options: ["apprendrais", "apprendrai", "apprenais"], bonne: 0, explication: "Si + imparfait, puis conditionnel présent." },
  { niveau: "B1", support: "« Le nouveau parc devait ouvrir en mai. À cause des pluies, les travaux ont pris du retard : l’ouverture est reportée à septembre. »", q: "Le parc ouvrira…", options: ["plus tard que prévu", "en mai, comme prévu", "jamais"], bonne: 0, explication: "L’ouverture est « reportée à septembre »." },
  // B2
  { niveau: "B2", q: "Bien qu’il ___ malade, il est venu travailler.", options: ["soit", "est", "était"], bonne: 0, explication: "Bien que + subjonctif." },
  { niveau: "B2", q: "« Viendrez-vous à la réunion ? » → Il m’a demandé ___ je viendrais à la réunion.", options: ["si", "que", "est-ce que"], bonne: 0, explication: "Interrogation indirecte d’une question fermée : si." },
  { niveau: "B2", q: "___ la pluie, le match a eu lieu.", options: ["Malgré", "Bien que", "Pourtant"], bonne: 0, explication: "Malgré + nom." },
  { niveau: "B2", support: "« Loin de résoudre le problème, la nouvelle taxe a surtout déplacé la circulation vers les petites rues. »", q: "Selon cette phrase, la taxe…", options: ["n’a pas atteint son objectif", "a réduit la circulation", "n’a eu aucun effet"], bonne: 0, explication: "« Loin de résoudre » : elle n’a pas résolu le problème ; elle a même déplacé la circulation." },
  // C1
  { niveau: "C1", q: "Les difficultés ___ l’entreprise doit faire face sont nombreuses.", options: ["auxquelles", "dont", "lesquelles"], bonne: 0, explication: "Faire face à quelque chose : auxquelles (à + lesquelles)." },
  { niveau: "C1", q: "On ne saurait ___ l’importance de cette découverte.", options: ["sous-estimer", "sous-estimant", "sous-estimé"], bonne: 0, explication: "Ne saurait + infinitif (registre soutenu) : on ne peut pas." },
  { niveau: "C1", q: "Ces arguments, pourtant ___, n’ont pas suffi.", options: ["convaincants", "convainquants", "convaincant"], bonne: 0, explication: "Adjectif verbal : il s’accorde et s’écrit avec c." },
  { niveau: "C1", support: "« Il serait naïf de croire que la technologie, à elle seule, réglera la question climatique. »", q: "L’auteur pense que…", options: ["la technologie ne suffira pas", "la technologie est inutile", "la question climatique est réglée"], bonne: 0, explication: "« à elle seule » : la technologie est nécessaire peut-être, mais insuffisante." },
  // C2
  { niveau: "C2", q: "Quoi qu’il en ___, nous maintiendrons notre décision.", options: ["soit", "est", "sera"], bonne: 0, explication: "Quoi qu’il en soit : subjonctif, locution figée." },
  { niveau: "C2", q: "Le ministre a fait ___ dans le débat.", options: ["irruption", "éruption", "interruption"], bonne: 0, explication: "Faire irruption : entrer brusquement." },
  { niveau: "C2", q: "Laquelle de ces phrases appartient au registre soutenu ?", options: ["Je ne saurais trop vous remercier.", "Merci mille fois, c’est super sympa.", "Franchement, merci, t’es génial."], bonne: 0, explication: "« Je ne saurais trop… » est une tournure soutenue." },
  { niveau: "C2", support: "« Il n’est pas jusqu’à ses détracteurs qui ne saluent la rigueur de l’enquête. »", q: "Cette phrase signifie que…", options: ["même ses critiques reconnaissent la qualité de l’enquête", "ses détracteurs contestent l’enquête", "personne ne salue l’enquête"], bonne: 0, explication: "« Il n’est pas jusqu’à… qui ne » : même eux le font." },
];

export interface ResultatTest {
  niveau: Niveau;
  /** Bonnes réponses par niveau (sur 4). */
  parNiveau: Record<Niveau, number>;
  total: number;
  /** Moins de 3 bonnes réponses au niveau A1 : bases à consolider. */
  debutant: boolean;
}

/**
 * Niveau estimé = le plus haut niveau réussi (au moins 3/4), à condition qu’aucun niveau
 * inférieur ne soit échoué (moins de 2/4). L’estimation s’arrête au premier niveau échoué.
 */
export function estimerNiveau(reponses: (number | undefined)[]): ResultatTest {
  const ordre: Niveau[] = ["A1", "A2", "B1", "B2", "C1", "C2"];
  const parNiveau = Object.fromEntries(ordre.map((n) => [n, 0])) as Record<Niveau, number>;
  TEST_NIVEAU.forEach((it, i) => {
    if (reponses[i] === it.bonne) parNiveau[it.niveau]++;
  });
  let niveau: Niveau = "A1";
  for (const n of ordre) {
    if (parNiveau[n] < 2) break;
    if (parNiveau[n] >= 3) niveau = n;
  }
  const total = Object.values(parNiveau).reduce((a, b) => a + b, 0);
  return { niveau, parNiveau, total, debutant: parNiveau.A1 < 3 };
}
