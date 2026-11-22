import { createClient, type RealtimeChannel, type SupabaseClient } from "@supabase/supabase-js";
import { abonnementValide, MSG_ACCES_EXPIRE, type Backend } from "./backend";
import type { Devoir, Lien, Message, PlanIA, PlanStructure, Profil, Role, Tentative } from "./types";

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
  dateExamen: r.date_examen ?? undefined,
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

const plan = (r: Ligne): PlanIA => ({ eleveId: r.eleve_id, texte: r.texte, contenu: r.contenu ?? undefined, creeLe: r.cree_le });

function ok<T>(res: { data: T; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return res.data;
}

export class SupabaseBackend implements Backend {
  readonly mode = "supabase" as const;
  readonly client: SupabaseClient;
  private cache: Profil | null = null;
  private ecouteurs = new Set<() => void>();
  private canal: RealtimeChannel | null = null;
  private minuterie: ReturnType<typeof setTimeout> | null = null;

  constructor(url: string, cle: string) {
    // PKCE : le lien magique revient avec un paramètre « code » (et non des jetons dans le fragment de l’URL,
    // que le routage par fragment de l’application interpréterait comme une page).
    this.client = createClient(url, cle, { auth: { flowType: "pkce" } });
    // Ne jamais rappeler Supabase directement dans ce rappel (risque de blocage) : on diffère.
    this.client.auth.onAuthStateChange((_evenement, session) => {
      this.cache = null;
      setTimeout(() => this.brancherTempsReel(!!session), 0);
      this.notifier();
    });
  }

  /** Un seul canal temps réel pour toute l’application, recréé à chaque changement de session. */
  private brancherTempsReel(connecte: boolean) {
    if (this.canal) {
      this.client.removeChannel(this.canal);
      this.canal = null;
    }
    if (!connecte) return;
    this.canal = this.client
      .channel("tremplin")
      .on("postgres_changes", { event: "*", schema: "public" }, () => {
        this.cache = null;
        this.notifier();
      })
      .subscribe();
  }

  /** Regroupe les rafales d’événements en un seul rafraîchissement. */
  private notifier() {
    if (this.minuterie) return;
    this.minuterie = setTimeout(() => {
      this.minuterie = null;
      this.ecouteurs.forEach((cb) => cb());
    }, 120);
  }

  onChange(cb: () => void) {
    this.ecouteurs.add(cb);
    return () => {
      this.ecouteurs.delete(cb);
    };
  }

  private async uid() {
    const { data } = await this.client.auth.getSession();
    const id = data.session?.user.id;
    if (!id) throw new Error("Vous n’êtes pas connecté.");
    return id;
  }

  async profilCourant() {
    const { data } = await this.client.auth.getSession();
    const id = data.session?.user.id;
    if (!id) return null;
    if (this.cache?.id === id) return this.cache;
    const r = await this.client.from("profils").select("*").eq("id", id).maybeSingle();
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

  async majProfil(p: Partial<Pick<Profil, "nom" | "langueIA" | "niveauVise" | "examenVise" | "dateExamen">>) {
    const id = await this.uid();
    const maj: Ligne = {};
    if ("nom" in p) maj.nom = p.nom ?? "";
    if ("langueIA" in p) maj.langue_ia = p.langueIA ?? "fr";
    if ("niveauVise" in p) maj.niveau_vise = p.niveauVise || null;
    if ("examenVise" in p) maj.examen_vise = p.examenVise || null;
    if ("dateExamen" in p) maj.date_examen = p.dateExamen || null;
    const r = ok(await this.client.from("profils").update(maj).eq("id", id).select("*").single());
    this.cache = profil(r);
    return this.cache;
  }

  async utiliserCode(code: string) {
    const r = ok(await this.client.rpc("utiliser_code", { code_saisi: code }));
    this.cache = profil(r as Ligne);
    return this.cache;
  }

  async supprimerCompte() {
    ok(await this.client.rpc("supprimer_mon_compte"));
    this.cache = null;
    await this.client.auth.signOut();
  }

  async inviter(email: string) {
    ok(await this.client.rpc("inviter", { email_cible: email }));
    const tous = await this.liens();
    const e = email.trim().toLowerCase();
    const l = tous.find((x) => x.emailInvite === e && x.statut === "en_attente");
    if (!l) throw new Error("Invitation enregistrée, mais introuvable : rechargez la page.");
    return l;
  }

  async liens() {
    const moi = await this.profilCourant();
    if (!moi) throw new Error("Vous n’êtes pas connecté.");
    const rows = ok(await this.client.from("liens").select("*").order("cree_le", { ascending: false })) as Ligne[];
    const ids = [...new Set(rows.flatMap((r) => [r.professeur_id, r.eleve_id]).filter(Boolean))];
    const ps = ids.length
      ? (ok(await this.client.from("profils").select("id,nom,email,abonnement,abonnement_fin,examen_vise,niveau_vise,date_examen").in("id", ids)) as Ligne[])
      : [];
    const carte = new Map(ps.map((p) => [p.id, p]));
    const valide = (p?: Ligne) => !!p && abonnementValide({ abonnement: p.abonnement, abonnementFin: p.abonnement_fin });
    return rows.map((r): Lien => {
      const pr = carte.get(r.professeur_id);
      const el = carte.get(r.eleve_id);
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
        suspendu: r.statut === "actif" && !(valide(pr) && valide(el)),
        incompatible: r.statut === "en_attente" && r.initiateur_id !== moi.id && r.professeur_id !== moi.id && r.eleve_id !== moi.id,
        eleveObjectif: el ? { examen: el.examen_vise ?? undefined, niveau: el.niveau_vise ?? undefined, dateExamen: el.date_examen ?? undefined } : undefined,
      };
    });
  }

  async repondreLien(id: string, accepter: boolean) {
    ok(await this.client.rpc("repondre_lien", { lien_id: id, accepter }));
  }

  async supprimerLien(id: string) {
    ok(await this.client.from("liens").delete().eq("id", id));
  }

  async enregistrerTentative(t: Omit<Tentative, "id" | "eleveId" | "faiteLe">) {
    const res = await this.client
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
      .single();
    if (res.error) {
      // Refus par la règle « accès valide » : message clair plutôt que l’erreur technique.
      const moi = await this.profilCourant();
      if (moi && !abonnementValide(moi)) throw new Error(MSG_ACCES_EXPIRE);
      throw new Error(res.error.message);
    }
    return tentative(res.data);
  }

  async tentatives(eleveId: string) {
    const rows = ok(
      await this.client.from("tentatives").select("*").eq("eleve_id", eleveId).order("faite_le", { ascending: false }).limit(1000),
    ) as Ligne[];
    return rows.map(tentative);
  }

  async commenterTentative(id: string, commentaire: string, note?: number) {
    ok(await this.client.rpc("commenter_tentative", { tentative_id: id, commentaire, note: note ?? null }));
  }

  async assigner(d: Omit<Devoir, "id" | "professeurId" | "statut" | "creeLe">) {
    const professeur_id = await this.uid();
    const res = await this.client
      .from("devoirs")
      .insert({ professeur_id, eleve_id: d.eleveId, activite_id: d.activiteId, consigne: d.consigne ?? null, echeance: d.echeance ?? null })
      .select("*")
      .single();
    if (res.error) throw new Error("Cet élève n’est pas lié à votre compte, ou l’un des deux accès a expiré.");
    return devoir(res.data);
  }

  async devoirs(eleveId?: string) {
    let q = this.client.from("devoirs").select("*").order("cree_le", { ascending: false });
    if (eleveId) q = q.eq("eleve_id", eleveId);
    return (ok(await q) as Ligne[]).map(devoir);
  }

  async supprimerDevoir(id: string) {
    ok(await this.client.from("devoirs").delete().eq("id", id));
  }

  async envoyer(aId: string, texte: string) {
    const res = await this.client.from("messages").insert({ a_id: aId, texte: texte.trim().slice(0, 4000) }).select("*").single();
    if (res.error) throw new Error("Message non envoyé : le lien doit être accepté et les deux accès actifs.");
    return message(res.data);
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

  async nonLus() {
    const moi = await this.uid();
    const rows = ok(await this.client.from("messages").select("de_id").eq("a_id", moi).eq("lu", false)) as Ligne[];
    const r: Record<string, number> = {};
    for (const m of rows) r[m.de_id] = (r[m.de_id] ?? 0) + 1;
    return r;
  }

  async enregistrerPlan(texte: string, contenu?: PlanStructure) {
    const eleve_id = await this.uid();
    const r = ok(
      await this.client.from("plans").upsert({ eleve_id, texte, contenu: contenu ?? null, cree_le: new Date().toISOString() }).select("*").single(),
    );
    return plan(r);
  }

  async plan(eleveId: string) {
    const r = ok(await this.client.from("plans").select("*").eq("eleve_id", eleveId).maybeSingle()) as Ligne | null;
    return r ? plan(r) : null;
  }
}
