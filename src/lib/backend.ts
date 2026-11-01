import type { Devoir, Lien, Message, PlanIA, Profil, Role, Tentative } from "./types";

/**
 * Contrat unique d’accès aux données. Deux implémentations :
 * - LocalBackend : mode démonstration, tout est stocké dans le navigateur ;
 * - SupabaseBackend : comptes réels (lien magique par courriel), base partagée.
 */
export interface Backend {
  readonly mode: "demo" | "supabase";

  // Session
  profilCourant(): Promise<Profil | null>;
  /** Envoie un lien de connexion (Supabase) ou ouvre directement la session (démo). */
  connexion(email: string, role: Role, nom: string): Promise<{ lienEnvoye: boolean }>;
  deconnexion(): Promise<void>;
  majProfil(p: Partial<Profil>): Promise<Profil>;
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

  // Messages
  envoyer(aId: string, texte: string): Promise<Message>;
  conversation(autreId: string): Promise<Message[]>;
  marquerLus(autreId: string): Promise<void>;

  // Plan d’amélioration
  enregistrerPlan(texte: string): Promise<PlanIA>;
  plan(eleveId: string): Promise<PlanIA | null>;
}

/** Abonnement valable = essai en cours ou période payée non échue. */
export function abonnementValide(p: Pick<Profil, "abonnement" | "abonnementFin">): boolean {
  if (p.abonnement === "expire") return false;
  return new Date(p.abonnementFin).getTime() > Date.now();
}

export const JOURS_ESSAI = 14;
