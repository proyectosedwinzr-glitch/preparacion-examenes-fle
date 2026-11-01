import { abonnementValide, JOURS_ESSAI, type Backend } from "./backend";
import type { Devoir, Lien, Message, PlanIA, Profil, Role, Tentative } from "./types";

const CLE = "tremplin-demo-v1";

interface Db {
  session: string | null;
  profils: Profil[];
  liens: Lien[];
  tentatives: Tentative[];
  devoirs: Devoir[];
  messages: Message[];
  plans: PlanIA[];
}

const vide = (): Db => ({ session: null, profils: [], liens: [], tentatives: [], devoirs: [], messages: [], plans: [] });

function lire(): Db {
  try {
    const brut = localStorage.getItem(CLE);
    return brut ? { ...vide(), ...JSON.parse(brut) } : vide();
  } catch {
    return vide();
  }
}

const uid = () => crypto.randomUUID();
const maintenant = () => new Date().toISOString();
const norm = (e: string) => e.trim().toLowerCase();

/**
 * Mode démonstration : plusieurs comptes peuvent coexister dans le même navigateur,
 * ce qui permet de jouer successivement l’élève et le professeur pour tester le lien.
 */
export class LocalBackend implements Backend {
  readonly mode = "demo" as const;
  private ecouteurs = new Set<() => void>();

  constructor() {
    window.addEventListener("storage", (e) => e.key === CLE && this.notifier());
  }

  private ecrire(db: Db) {
    localStorage.setItem(CLE, JSON.stringify(db));
    this.notifier();
  }
  private notifier() {
    this.ecouteurs.forEach((cb) => cb());
  }
  onChange(cb: () => void) {
    this.ecouteurs.add(cb);
    return () => {
      this.ecouteurs.delete(cb);
    };
  }

  private moi(db: Db): Profil {
    const p = db.profils.find((x) => x.id === db.session);
    if (!p) throw new Error("Vous n’êtes pas connecté.");
    return p;
  }

  async profilCourant() {
    const db = lire();
    return db.profils.find((p) => p.id === db.session) ?? null;
  }

  async connexion(email: string, role: Role, nom: string) {
    const db = lire();
    const e = norm(email);
    let p = db.profils.find((x) => x.email === e);
    if (!p) {
      const fin = new Date(Date.now() + JOURS_ESSAI * 86400000).toISOString();
      p = { id: uid(), email: e, nom: nom.trim() || e.split("@")[0], role, langueIA: "fr", abonnement: "essai", abonnementFin: fin };
      db.profils.push(p);
    }
    // Rattache les invitations reçues avant la création du compte.
    for (const l of db.liens) {
      if (l.emailInvite === e && l.initiateurId !== p.id) {
        if (p.role === "professeur" && !l.professeurId) l.professeurId = p.id;
        if (p.role === "eleve" && !l.eleveId) l.eleveId = p.id;
      }
    }
    db.session = p.id;
    this.ecrire(db);
    return { lienEnvoye: false };
  }

  async deconnexion() {
    const db = lire();
    db.session = null;
    this.ecrire(db);
  }

  async majProfil(maj: Partial<Profil>) {
    const db = lire();
    const p = this.moi(db);
    Object.assign(p, maj, { id: p.id, email: p.email, role: p.role });
    this.ecrire(db);
    return p;
  }

  private enrichir(db: Db, l: Lien): Lien {
    const prof = db.profils.find((p) => p.id === l.professeurId);
    const el = db.profils.find((p) => p.id === l.eleveId);
    return {
      ...l,
      professeurNom: prof?.nom,
      professeurEmail: prof?.email ?? (l.professeurId ? undefined : l.emailInvite),
      eleveNom: el?.nom,
      eleveEmail: el?.email ?? (l.eleveId ? undefined : l.emailInvite),
    };
  }

  async inviter(email: string) {
    const db = lire();
    const moi = this.moi(db);
    const e = norm(email);
    if (e === moi.email) throw new Error("Vous ne pouvez pas vous inviter vous-même.");
    const cible = db.profils.find((p) => p.email === e);
    if (cible && cible.role === moi.role)
      throw new Error(moi.role === "eleve" ? "Cette adresse correspond à un compte élève, pas à un professeur." : "Cette adresse correspond à un compte professeur, pas à un élève.");
    const existe = db.liens.find(
      (l) => l.statut !== "refuse" && l.emailInvite === e && (l.professeurId === moi.id || l.eleveId === moi.id),
    );
    if (existe) throw new Error("Une invitation existe déjà pour cette adresse.");
    const l: Lien = {
      id: uid(),
      emailInvite: e,
      initiateurId: moi.id,
      statut: "en_attente",
      creeLe: maintenant(),
      professeurId: moi.role === "professeur" ? moi.id : cible?.id,
      eleveId: moi.role === "eleve" ? moi.id : cible?.id,
    };
    db.liens.push(l);
    this.ecrire(db);
    return this.enrichir(db, l);
  }

  async liens() {
    const db = lire();
    const moi = this.moi(db);
    return db.liens
      .filter((l) => l.professeurId === moi.id || l.eleveId === moi.id || l.emailInvite === moi.email)
      .map((l) => this.enrichir(db, l));
  }

  async repondreLien(id: string, accepter: boolean) {
    const db = lire();
    const moi = this.moi(db);
    const l = db.liens.find((x) => x.id === id);
    if (!l) throw new Error("Invitation introuvable.");
    if (l.initiateurId === moi.id) throw new Error("C’est la personne invitée qui doit répondre.");
    if (accepter) {
      const autre = db.profils.find((p) => p.id === l.initiateurId);
      if (!abonnementValide(moi)) throw new Error("Votre abonnement doit être actif pour accepter le lien.");
      if (!autre || !abonnementValide(autre)) throw new Error("L’abonnement de la personne qui vous invite n’est pas actif.");
    }
    l.statut = accepter ? "actif" : "refuse";
    this.ecrire(db);
  }

  async supprimerLien(id: string) {
    const db = lire();
    const moi = this.moi(db);
    db.liens = db.liens.filter((l) => !(l.id === id && (l.professeurId === moi.id || l.eleveId === moi.id)));
    this.ecrire(db);
  }

  /** Le professeur ne lit que les données de ses élèves liés (même règle que la base réelle). */
  private peutLire(db: Db, eleveId: string) {
    const moi = this.moi(db);
    if (moi.id === eleveId) return true;
    return db.liens.some((l) => l.statut === "actif" && l.professeurId === moi.id && l.eleveId === eleveId);
  }

  async enregistrerTentative(t: Omit<Tentative, "id" | "eleveId" | "faiteLe">) {
    const db = lire();
    const moi = this.moi(db);
    const n: Tentative = { ...t, id: uid(), eleveId: moi.id, faiteLe: maintenant() };
    db.tentatives.push(n);
    if (t.devoirId) {
      const d = db.devoirs.find((x) => x.id === t.devoirId && x.eleveId === moi.id);
      if (d) d.statut = "fait";
    }
    this.ecrire(db);
    return n;
  }

  async tentatives(eleveId: string) {
    const db = lire();
    if (!this.peutLire(db, eleveId)) return [];
    return db.tentatives.filter((t) => t.eleveId === eleveId).sort((a, b) => b.faiteLe.localeCompare(a.faiteLe));
  }

  async commenterTentative(id: string, commentaire: string, note?: number) {
    const db = lire();
    const t = db.tentatives.find((x) => x.id === id);
    if (!t || !this.peutLire(db, t.eleveId) || this.moi(db).role !== "professeur") throw new Error("Action non autorisée.");
    t.commentaireProf = commentaire;
    t.noteProf = note;
    this.ecrire(db);
  }

  async assigner(d: Omit<Devoir, "id" | "professeurId" | "statut" | "creeLe">) {
    const db = lire();
    const moi = this.moi(db);
    if (moi.role !== "professeur" || !this.peutLire(db, d.eleveId)) throw new Error("Cet élève n’est pas lié à votre compte.");
    const n: Devoir = { ...d, id: uid(), professeurId: moi.id, statut: "a_faire", creeLe: maintenant() };
    db.devoirs.push(n);
    this.ecrire(db);
    return n;
  }

  async devoirs(eleveId?: string) {
    const db = lire();
    const moi = this.moi(db);
    return db.devoirs
      .filter((d) => (moi.role === "eleve" ? d.eleveId === moi.id : d.professeurId === moi.id && (!eleveId || d.eleveId === eleveId)))
      .sort((a, b) => b.creeLe.localeCompare(a.creeLe));
  }

  async envoyer(aId: string, texte: string) {
    const db = lire();
    const moi = this.moi(db);
    const lie = db.liens.some(
      (l) => l.statut === "actif" && ((l.professeurId === moi.id && l.eleveId === aId) || (l.eleveId === moi.id && l.professeurId === aId)),
    );
    if (!lie) throw new Error("Vous ne pouvez écrire qu’à une personne liée à votre compte.");
    const m: Message = { id: uid(), deId: moi.id, aId, texte: texte.trim(), envoyeLe: maintenant(), lu: false };
    db.messages.push(m);
    this.ecrire(db);
    return m;
  }

  async conversation(autreId: string) {
    const db = lire();
    const moi = this.moi(db);
    return db.messages
      .filter((m) => (m.deId === moi.id && m.aId === autreId) || (m.deId === autreId && m.aId === moi.id))
      .sort((a, b) => a.envoyeLe.localeCompare(b.envoyeLe));
  }

  async marquerLus(autreId: string) {
    const db = lire();
    const moi = this.moi(db);
    let change = false;
    for (const m of db.messages) if (m.deId === autreId && m.aId === moi.id && !m.lu) (m.lu = true), (change = true);
    if (change) this.ecrire(db);
  }

  async enregistrerPlan(texte: string) {
    const db = lire();
    const moi = this.moi(db);
    const p: PlanIA = { eleveId: moi.id, texte, creeLe: maintenant() };
    db.plans = db.plans.filter((x) => x.eleveId !== moi.id).concat(p);
    this.ecrire(db);
    return p;
  }

  async plan(eleveId: string) {
    const db = lire();
    if (!this.peutLire(db, eleveId)) return null;
    return db.plans.find((p) => p.eleveId === eleveId) ?? null;
  }
}
