import { abonnementValide, JOURS_ESSAI, MSG_ACCES_EXPIRE, type Backend } from "./backend";
import type { Devoir, Lien, Message, PlanIA, PlanStructure, Profil, Role, Tentative } from "./types";

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
const JOUR = 86400000;

/** Codes acceptés en démonstration (réutilisables). Nombre de jours ajoutés ; 0 = simule un accès expiré. */
export const CODES_DEMO: Record<string, number> = { "DEMO-30": 30, "DEMO-365": 365, "DEMO-EXPIRE": 0 };

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

  /** Lien accepté ET accès valides des deux côtés (même règle que la base réelle). */
  private lienOperationnel(db: Db, profId: string | undefined, eleveId: string | undefined): boolean {
    if (!profId || !eleveId) return false;
    if (!db.liens.some((l) => l.statut === "actif" && l.professeurId === profId && l.eleveId === eleveId)) return false;
    const prof = db.profils.find((p) => p.id === profId);
    const el = db.profils.find((p) => p.id === eleveId);
    return !!prof && !!el && abonnementValide(prof) && abonnementValide(el);
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
      const fin = new Date(Date.now() + JOURS_ESSAI * JOUR).toISOString();
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

  async majProfil(maj: Partial<Pick<Profil, "nom" | "langueIA" | "niveauVise" | "examenVise" | "dateExamen">>) {
    const db = lire();
    const p = this.moi(db);
    for (const cle of ["nom", "langueIA", "niveauVise", "examenVise", "dateExamen"] as const) {
      if (cle in maj) (p as unknown as Record<string, unknown>)[cle] = maj[cle] || undefined;
    }
    if (!p.nom) p.nom = p.email.split("@")[0];
    if (!p.langueIA) p.langueIA = "fr";
    this.ecrire(db);
    return p;
  }

  async utiliserCode(code: string) {
    const db = lire();
    const p = this.moi(db);
    const c = code.trim().toUpperCase();
    if (!(c in CODES_DEMO)) throw new Error("Code invalide ou déjà utilisé.");
    const jours = CODES_DEMO[c];
    if (jours === 0) {
      p.abonnement = "expire";
      p.abonnementFin = maintenant();
    } else {
      const base = abonnementValide(p) ? new Date(p.abonnementFin).getTime() : Date.now();
      p.abonnement = "actif";
      p.abonnementFin = new Date(base + jours * JOUR).toISOString();
    }
    this.ecrire(db);
    return p;
  }

  async supprimerCompte() {
    const db = lire();
    const moi = this.moi(db);
    db.profils = db.profils.filter((p) => p.id !== moi.id);
    db.liens = db.liens.filter((l) => l.professeurId !== moi.id && l.eleveId !== moi.id && l.initiateurId !== moi.id);
    db.tentatives = db.tentatives.filter((t) => t.eleveId !== moi.id);
    db.devoirs = db.devoirs.filter((d) => d.eleveId !== moi.id && d.professeurId !== moi.id);
    db.messages = db.messages.filter((m) => m.deId !== moi.id && m.aId !== moi.id);
    db.plans = db.plans.filter((p) => p.eleveId !== moi.id);
    db.session = null;
    this.ecrire(db);
  }

  private enrichir(db: Db, l: Lien, moi: Profil): Lien {
    const prof = db.profils.find((p) => p.id === l.professeurId);
    const el = db.profils.find((p) => p.id === l.eleveId);
    return {
      ...l,
      professeurNom: prof?.nom,
      professeurEmail: prof?.email ?? (l.professeurId ? undefined : l.emailInvite),
      eleveNom: el?.nom,
      eleveEmail: el?.email ?? (l.eleveId ? undefined : l.emailInvite),
      suspendu: l.statut === "actif" && !this.lienOperationnel(db, l.professeurId, l.eleveId),
      incompatible: l.statut === "en_attente" && l.initiateurId !== moi.id && l.professeurId !== moi.id && l.eleveId !== moi.id,
      eleveObjectif: el ? { examen: el.examenVise, niveau: el.niveauVise, dateExamen: el.dateExamen } : undefined,
    };
  }

  async inviter(email: string) {
    const db = lire();
    const moi = this.moi(db);
    const e = norm(email);
    if (!abonnementValide(moi)) throw new Error("Votre accès doit être actif pour inviter quelqu’un.");
    if (e === moi.email) throw new Error("Vous ne pouvez pas vous inviter vous-même.");
    const cible = db.profils.find((p) => p.email === e);
    if (cible && cible.role === moi.role)
      throw new Error(moi.role === "eleve" ? "Cette adresse correspond à un compte élève, pas à un professeur." : "Cette adresse correspond à un compte professeur, pas à un élève.");
    const existe = db.liens.find(
      (l) => l.statut !== "refuse" && (l.professeurId === moi.id || l.eleveId === moi.id) &&
        (l.emailInvite === e || (cible && (l.professeurId === cible.id || l.eleveId === cible.id))),
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
    return this.enrichir(db, l, moi);
  }

  async liens() {
    const db = lire();
    const moi = this.moi(db);
    return db.liens
      .filter((l) => l.professeurId === moi.id || l.eleveId === moi.id || l.emailInvite === moi.email)
      .sort((a, b) => b.creeLe.localeCompare(a.creeLe))
      .map((l) => this.enrichir(db, l, moi));
  }

  async repondreLien(id: string, accepter: boolean) {
    const db = lire();
    const moi = this.moi(db);
    const l = db.liens.find((x) => x.id === id);
    if (!l) throw new Error("Invitation introuvable.");
    if (l.initiateurId === moi.id) throw new Error("C’est la personne invitée qui doit répondre.");
    if (l.professeurId !== moi.id && l.eleveId !== moi.id) throw new Error("Cette invitation ne correspond pas au rôle de votre compte.");
    if (accepter) {
      const autre = db.profils.find((p) => p.id === l.initiateurId);
      if (!abonnementValide(moi)) throw new Error("Votre accès doit être actif pour accepter le lien.");
      if (!autre || !abonnementValide(autre)) throw new Error("L’accès de la personne qui vous invite n’est pas actif.");
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
    return moi.id === eleveId || this.lienOperationnel(db, moi.id, eleveId);
  }

  async enregistrerTentative(t: Omit<Tentative, "id" | "eleveId" | "faiteLe">) {
    const db = lire();
    const moi = this.moi(db);
    if (!abonnementValide(moi)) throw new Error(MSG_ACCES_EXPIRE);
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
    const moi = this.moi(db);
    const t = db.tentatives.find((x) => x.id === id);
    if (!t || moi.role !== "professeur" || !this.lienOperationnel(db, moi.id, t.eleveId)) throw new Error("Action non autorisée.");
    if (note !== undefined && (Number.isNaN(note) || note < 0 || note > 20)) throw new Error("La note doit être comprise entre 0 et 20.");
    t.commentaireProf = commentaire.trim() || undefined;
    t.noteProf = note;
    this.ecrire(db);
  }

  async assigner(d: Omit<Devoir, "id" | "professeurId" | "statut" | "creeLe">) {
    const db = lire();
    const moi = this.moi(db);
    if (moi.role !== "professeur" || !this.lienOperationnel(db, moi.id, d.eleveId)) throw new Error("Cet élève n’est pas lié à votre compte, ou l’un des deux accès a expiré.");
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

  async supprimerDevoir(id: string) {
    const db = lire();
    const moi = this.moi(db);
    db.devoirs = db.devoirs.filter((d) => !(d.id === id && d.professeurId === moi.id));
    this.ecrire(db);
  }

  async envoyer(aId: string, texte: string) {
    const db = lire();
    const moi = this.moi(db);
    const lie = moi.role === "professeur" ? this.lienOperationnel(db, moi.id, aId) : this.lienOperationnel(db, aId, moi.id);
    if (!lie) throw new Error("Vous ne pouvez écrire qu’à une personne liée à votre compte, avec deux accès actifs.");
    const propre = texte.trim().slice(0, 4000);
    if (!propre) throw new Error("Le message est vide.");
    const m: Message = { id: uid(), deId: moi.id, aId, texte: propre, envoyeLe: maintenant(), lu: false };
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

  async nonLus() {
    const db = lire();
    const moi = this.moi(db);
    const r: Record<string, number> = {};
    for (const m of db.messages) if (m.aId === moi.id && !m.lu) r[m.deId] = (r[m.deId] ?? 0) + 1;
    return r;
  }

  async enregistrerPlan(texte: string, contenu?: PlanStructure) {
    const db = lire();
    const moi = this.moi(db);
    const p: PlanIA = { eleveId: moi.id, texte, contenu, creeLe: maintenant() };
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
