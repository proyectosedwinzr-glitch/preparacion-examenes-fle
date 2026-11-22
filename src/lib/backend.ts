import type { Devoir, Lien, Message, PlanIA, PlanStructure, Profil, Role, Tentative } from "./types";

/**
 * Contrat unique d’accès aux données. Deux implémentations :
 * - LocalBackend : mode démonstration, tout est stocké dans le navigateur ;
 * - SupabaseBackend : comptes réels (lien magique par courriel), base partagée.
 *
 * Règles d’accès (identiques dans les deux) :
 * - un professeur ne lit que les données des élèves liés par un lien accepté ;
 * - le lien n’opère que si les deux accès (essai ou abonnement) sont valides ;
 * - sans accès valide, un élève consulte les contenus mais n’enregistre plus de résultats.
 */
export interface Backend {
  readonly mode: "demo" | "supabase";

  // Session
  profilCourant(): Promise<Profil | null>;
  /** Envoie un lien de connexion (Supabase) ou ouvre directement la session (démo). */
  connexion(email: string, role: Role, nom: string): Promise<{ lienEnvoye: boolean }>;
  deconnexion(): Promise<void>;
  majProfil(p: Partial<Pick<Profil, "nom" | "langueIA" | "niveauVise" | "examenVise" | "dateExamen">>): Promise<Profil>;
  /** Prolonge l’accès avec un code d’activation. */
  utiliserCode(code: string): Promise<Profil>;
  /** Supprime définitivement le compte et toutes ses données. */
  supprimerCompte(): Promise<void>;
  onChange(cb: () => void): () => void;

  // Liens professeur ↔ élève
  inviter(email: string): Promise<Lien>;
  liens(): Promise<Lien[]>;
  repondreLien(id: string, accepter: boolean): Promise<void>;
  supprimerLien(id: string): Promise<void>;

  // Activités réalisées
  enregistrerTentative(t: Omit<Tentative, "id" | "eleveId" | "faiteLe">): Promise<Tentative>;
  tentatives(eleveId: string): Promise<Tentative[]>;
  commenterTentative(id: string, commentaire: string, note?: number): Promise<void>;

  // Devoirs
  assigner(d: Omit<Devoir, "id" | "professeurId" | "statut" | "creeLe">): Promise<Devoir>;
  devoirs(eleveId?: string): Promise<Devoir[]>;
  supprimerDevoir(id: string): Promise<void>;

  // Messages
  envoyer(aId: string, texte: string): Promise<Message>;
  conversation(autreId: string): Promise<Message[]>;
  marquerLus(autreId: string): Promise<void>;
  /** Nombre de messages non lus, par expéditeur. */
  nonLus(): Promise<Record<string, number>>;

  // Plan d’amélioration
  enregistrerPlan(texte: string, contenu?: PlanStructure): Promise<PlanIA>;
  plan(eleveId: string): Promise<PlanIA | null>;
}

/** Accès valable = essai en cours ou période payée non échue. */
export function abonnementValide(p: Pick<Profil, "abonnement" | "abonnementFin">): boolean {
  if (p.abonnement === "expire") return false;
  return new Date(p.abonnementFin).getTime() > Date.now();
}

export const JOURS_ESSAI = 14;

/** Message unique pour un enregistrement refusé faute d’accès valide. */
export const MSG_ACCES_EXPIRE = "Votre accès a expiré : le résultat n’est pas enregistré. Renouvelez-le dans « Mon compte ».";
