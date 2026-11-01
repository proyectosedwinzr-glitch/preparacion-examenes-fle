// Modèle de données commun au mode démo (localStorage) et à Supabase.

export type Role = "eleve" | "professeur";
export type Niveau = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
export const NIVEAUX: Niveau[] = ["A1", "A2", "B1", "B2", "C1", "C2"];

/** Compétences évaluées. CO/CE/PE/PO = les quatre compétences ; LS = lexique et structures. */
export type Competence = "CO" | "CE" | "PE" | "PO" | "LS";
export const COMPETENCES: Record<Competence, string> = {
  CO: "Compréhension de l’oral",
  CE: "Compréhension des écrits",
  PE: "Production écrite",
  PO: "Production orale",
  LS: "Lexique et structures",
};

export type ExamId = "delf" | "dalf" | "tcf" | "tcfq" | "tef" | "evalang" | "ccip" | "voltaire";
export type LangueIA = "fr" | "es" | "en" | "pt";

export type Abonnement = "essai" | "actif" | "expire";

export interface Profil {
  id: string;
  email: string;
  nom: string;
  role: Role;
  langueIA: LangueIA;
  niveauVise?: Niveau;
  examenVise?: ExamId;
  abonnement: Abonnement;
  /** Date ISO de fin de l’essai ou de la période payée. */
  abonnementFin: string;
}

export type StatutLien = "en_attente" | "actif" | "refuse";

export interface Lien {
  id: string;
  professeurId?: string;
  eleveId?: string;
  /** Adresse de la personne invitée (avant qu’elle ait un compte). */
  emailInvite: string;
  initiateurId: string;
  statut: StatutLien;
  creeLe: string;
  /** Renseignés pour l’affichage. */
  professeurNom?: string;
  eleveNom?: string;
  professeurEmail?: string;
  eleveEmail?: string;
}

export interface CorrectionIA {
  niveauEstime: string;
  note: number; // sur 20
  criteres: { nom: string; points: number; max: number; commentaire: string }[];
  erreurs: { extrait: string; correction: string; explication: string }[];
  pointsForts: string[];
  conseils: string[];
}

export interface Tentative {
  id: string;
  eleveId: string;
  activiteId: string;
  titre: string;
  niveau: Niveau;
  competence: Competence;
  examens: ExamId[];
  score: number;
  max: number;
  /** Réponses de l’élève, pour que le professeur voie le détail. */
  reponses?: Record<string, string>;
  production?: string;
  correction?: CorrectionIA;
  commentaireProf?: string;
  noteProf?: number;
  devoirId?: string;
  faiteLe: string;
}

export interface Devoir {
  id: string;
  professeurId: string;
  eleveId: string;
  activiteId: string;
  consigne?: string;
  echeance?: string;
  statut: "a_faire" | "fait";
  creeLe: string;
}

export interface Message {
  id: string;
  deId: string;
  aId: string;
  texte: string;
  envoyeLe: string;
  lu: boolean;
}

export interface PlanIA {
  eleveId: string;
  texte: string;
  creeLe: string;
}
