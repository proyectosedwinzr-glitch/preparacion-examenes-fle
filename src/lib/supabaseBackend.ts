import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Backend } from "./backend";
import type { Devoir, Lien, Message, PlanIA, Profil, Role, Tentative } from "./types";

/* eslint-disable @typescript-eslint/no-explicit-any */
type Ligne = Record<string, any>;

const profil = (r: Ligne): Profil => ({
  id: r.id,
  email: r.email,
  nom: r.nom,
  role: r.role,
  langueIA: r.langue_ia,
  niveauVise: r.niveau_vise ?? undefined,
  examenVise: r.examen_vise ?? undefined,
  abonnement: r.abonnement,
  abonnementFin: r.abonnement_fin,
});

const tentative = (r: Ligne): Tentative => ({
  id: r.id,
  eleveId: r.eleve_id,
  activiteId: r.activite_id,
  titre: r.titre,
  niveau: r.niveau,
  competence: r.competence,
  examens: r.examens ?? [],
  score: Number(r.score),
  max: Number(r.max),
  reponses: r.reponses ?? undefined,
  production: r.production ?? undefined,
  correction: r.correction ?? undefined,
  commentaireProf: r.commentaire_prof ?? undefined,
  noteProf: r.note_prof == null ? undefined : Number(r.note_prof),
  devoirId: r.devoir_id ?? undefined,
  faiteLe: r.faite_le,
});

const devoir = (r: Ligne): Devoir => ({
  id: r.id,
  professeurId: r.professeur_id,
  eleveId: r.eleve_id,
  activiteId: r.activite_id,
  consigne: r.consigne ?? undefined,
  echeance: r.echeance ?? undefined,
  statut: r.statut,
  creeLe: r.cree_le,
});

const message = (r: Ligne): Message => ({ id: r.id, deId: r.de_id, aId: r.a_id, texte: r.texte, envoyeLe: r.envoye_le, lu: r.lu });

function ok<T>(res: { data: T; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return res.data;
}

export class SupabaseBackend implements Backend {
  readonly mode = "supabase" as const;
  readonly client: SupabaseClient;
  private cache: Profil | null = null;

  constructor(url: string, cle: string) {
    this.client = createClient(url, cle);
    this.client.auth.onAuthStateChange(() => (this.cache = null));
  }

  onChange(cb: () => void) {
    const { data } = this.client.auth.onAuthStateChange(() => cb());
    const canal = this.client
      .channel("tremplin")
      .on("postgres_changes", { event: "*", schema: "public" }, () => cb())
      .subscribe();
    return () => {
      data.subscription.unsubscribe();
      this.client.removeChannel(canal);
    };
  }

  private async uid() {
    const { data } = await this.client.auth.getUser();
    if (!data.user) throw new Error("Vous n’êtes pas connecté.");
    return data.user.id;
  }

  async profilCourant() {
    const { data } = await this.client.auth.getUser();
    if (!data.user) return null;
    if (this.cache?.id === data.user.id) return this.cache;
    const r = await this.client.from("profils").select("*").eq("id", data.user.id).maybeSingle();
    this.cache = r.data ? profil(r.data) : null;
    return this.cache;
  }

  async connexion(email: string, role: Role, nom: string) {
    ok(
      await this.client.auth.signInWithOtp({
        email: email.trim().toLowerCase(),
        options: { data: { role, nom }, emailRedirectTo: window.location.origin + window.location.pathname },
      }),
    );
    return { lienEnvoye: true };
  }

  async deconnexion() {
    await this.client.auth.signOut();
  }

  async majProfil(p: Partial<Profil>) {
    const id = await this.uid();
    const maj: Ligne = {};
    if (p.nom !== undefined) maj.nom = p.nom;
    if (p.langueIA !== undefined) maj.langue_ia = p.langueIA;
    if (p.niveauVise !== undefined) maj.niveau_vise = p.niveauVise;
    if (p.examenVise !== undefined) maj.examen_vise = p.examenVise;
    const r = ok(await this.client.from("profils").update(maj).eq("id", id).select("*").single());
    this.cache = profil(r);
    return this.cache;
  }

  async inviter(email: string) {
    const r = ok(await this.client.rpc("inviter", { email_cible: email }));
    return this.versLien(r as Ligne, new Map());
  }

  private versLien(r: Ligne, profils: Map<string, Ligne>): Lien {
    const pr = profils.get(r.professeur_id);
    const el = profils.get(r.eleve_id);
    return {
      id: r.id,
      professeurId: r.professeur_id ?? undefined,
      eleveId: r.eleve_id ?? undefined,
      emailInvite: r.email_invite,
      initiateurId: r.initiateur_id,
      statut: r.statut,
      creeLe: r.cree_le,
      professeurNom: pr?.nom,
      professeurEmail: pr?.email ?? (r.professeur_id ? undefined : r.email_invite),
      eleveNom: el?.nom,
      eleveEmail: el?.email ?? (r.eleve_id ? undefined : r.email_invite),
    };
  }

  async liens() {
    const rows = ok(await this.client.from("liens").select("*").order("cree_le", { ascending: false })) as Ligne[];
    const ids = [...new Set(rows.flatMap((r) => [r.professeur_id, r.eleve_id]).filter(Boolean))];
    const ps = ids.length ? (ok(await this.client.from("profils").select("id,nom,email").in("id", ids)) as Ligne[]) : [];
    const carte = new Map(ps.map((p) => [p.id, p]));
    return rows.map((r) => this.versLien(r, carte));
  }

  async repondreLien(id: string, accepter: boolean) {
    ok(await this.client.rpc("repondre_lien", { lien_id: id, accepter }));
  }

  async supprimerLien(id: string) {
    ok(await this.client.from("liens").delete().eq("id", id));
  }

  async enregistrerTentative(t: Omit<Tentative, "id" | "eleveId" | "faiteLe">) {
    const r = ok(
      await this.client
        .from("tentatives")
        .insert({
          activite_id: t.activiteId,
          titre: t.titre,
          niveau: t.niveau,
          competence: t.competence,
          examens: t.examens,
          score: t.score,
          max: t.max,
          reponses: t.reponses ?? null,
          production: t.production ?? null,
          correction: t.correction ?? null,
          devoir_id: t.devoirId ?? null,
        })
        .select("*")
        .single(),
    );
    return tentative(r);
  }

  async tentatives(eleveId: string) {
    const rows = ok(
      await this.client.from("tentatives").select("*").eq("eleve_id", eleveId).order("faite_le", { ascending: false }).limit(500),
    ) as Ligne[];
    return rows.map(tentative);
  }

  async commenterTentative(id: string, commentaire: string, note?: number) {
    ok(await this.client.rpc("commenter_tentative", { tentative_id: id, commentaire, note: note ?? null }));
  }

  async assigner(d: Omit<Devoir, "id" | "professeurId" | "statut" | "creeLe">) {
    const professeur_id = await this.uid();
    const r = ok(
      await this.client
        .from("devoirs")
        .insert({ professeur_id, eleve_id: d.eleveId, activite_id: d.activiteId, consigne: d.consigne ?? null, echeance: d.echeance ?? null })
        .select("*")
        .single(),
    );
    return devoir(r);
  }

  async devoirs(eleveId?: string) {
    let q = this.client.from("devoirs").select("*").order("cree_le", { ascending: false });
    if (eleveId) q = q.eq("eleve_id", eleveId);
    return (ok(await q) as Ligne[]).map(devoir);
  }

  async envoyer(aId: string, texte: string) {
    const r = ok(await this.client.from("messages").insert({ a_id: aId, texte: texte.trim() }).select("*").single());
    return message(r);
  }

  async conversation(autreId: string) {
    const moi = await this.uid();
    const rows = ok(
      await this.client
        .from("messages")
        .select("*")
        .or(`and(de_id.eq.${moi},a_id.eq.${autreId}),and(de_id.eq.${autreId},a_id.eq.${moi})`)
        .order("envoye_le"),
    ) as Ligne[];
    return rows.map(message);
  }

  async marquerLus(autreId: string) {
    const moi = await this.uid();
    await this.client.from("messages").update({ lu: true }).eq("de_id", autreId).eq("a_id", moi).eq("lu", false);
  }

  async enregistrerPlan(texte: string) {
    const eleve_id = await this.uid();
    const r = ok(await this.client.from("plans").upsert({ eleve_id, texte, cree_le: new Date().toISOString() }).select("*").single());
    return { eleveId: r.eleve_id, texte: r.texte, creeLe: r.cree_le } as PlanIA;
  }

  async plan(eleveId: string) {
    const r = ok(await this.client.from("plans").select("*").eq("eleve_id", eleveId).maybeSingle()) as Ligne | null;
    return r ? { eleveId: r.eleve_id, texte: r.texte, creeLe: r.cree_le } : null;
  }
}
