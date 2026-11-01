# Tremplin FLE

Application web de préparation aux examens de français langue étrangère, en autonomie **et** avec son professeur.

- **Élève** : fiches des 8 examens (DELF, DALF, TCF, TCF Québec, TEF, Ev@lang, DFP de la CCI Paris, Certificat Voltaire), niveaux A1 à C2 avec fiches pédagogiques, banque d’activités corrigées, correction des productions par IA, plan d’amélioration, suivi des progrès.
- **Professeur** : liste de ses élèves, mêmes progrès que l’élève (détail des réponses, productions, corrections), commentaire et note sur chaque activité, devoirs ciblés par niveau, compétence et examen, messagerie.
- **Lien élève ↔ professeur par courriel, dans les deux sens.** Le lien ne devient actif que si les deux comptes ont un accès valide. Aucune commission sur les cours : chacun paie seulement son accès aux outils.

## Démarrer

```bash
npm install
npm run dev          # http://localhost:5173
```

Sans configuration, l’application tourne en **mode démonstration** : les données restent dans le navigateur et l’IA renvoie un retour simplifié. On peut créer un compte élève puis un compte professeur dans le même navigateur pour tester le lien.

Contrôles :

```bash
npm run typecheck      # TypeScript
npm run check:content  # cohérence du contenu pédagogique (identifiants, bonnes réponses, typographie)
npm run build && npx vite preview --port 4173 & node scripts/e2e.cjs   # parcours complet élève + professeur dans Chromium
```

## Architecture

| Pièce | Choix | Fichiers |
| --- | --- | --- |
| Interface | React + TypeScript (Vite), web responsive, thème clair/sombre, installable (PWA) | `src/` |
| Contenu pédagogique | Données typées, versionnées dans le dépôt | `src/data/exams.ts`, `levels.ts`, `activities.ts` |
| Comptes et données | Supabase : connexion par lien magique, Postgres avec sécurité par ligne (RLS) | `supabase/migrations/001_init.sql`, `src/lib/supabaseBackend.ts` |
| Mode démonstration | Même interface de données, stockage local | `src/lib/localBackend.ts` |
| IA | Fonction serveur qui garde la clé API, vérifie l’abonnement et applique un quota mensuel | `supabase/functions/ia/index.ts`, `src/lib/ai.ts` |

Règles de sécurité clés (dans la base, pas seulement dans l’interface) : un professeur ne lit que les données des élèves liés par un lien **actif** ; seule la personne invitée peut accepter ; l’acceptation exige deux abonnements valides ; un élève ne peut pas modifier son abonnement ni le commentaire de son professeur.

## Mise en production (à faire)

1. Créer un projet Supabase, exécuter `supabase/migrations/001_init.sql`.
2. Déployer la fonction `ia` et définir `ANTHROPIC_API_KEY` (optionnel : `IA_MODELE`, `IA_QUOTA_MENSUEL`, 60 par défaut).
3. Copier `.env.example` en `.env` avec l’URL et la clé publique Supabase, puis `npm run build` et héberger `dist/` (Netlify, Vercel, Cloudflare Pages…).
4. Brancher le paiement : un webhook du prestataire met à jour `profils.abonnement` et `abonnement_fin` (clé service uniquement).

## État des tests

Testé (mode démonstration, Chromium, `scripts/e2e.cjs`) : inscription élève et professeur, invitation par courriel et acceptation, QCM, texte à trous (signalement des accents), production écrite, tâche orale avec auto-évaluation, progrès et plan, vue professeur identique, commentaire et note, devoir assigné puis rendu, messagerie, affichage mobile et sombre, absence d’erreurs JavaScript.

**Non testé** : tout ce qui dépend d’un vrai projet Supabase (lien magique, règles RLS, temps réel) et la fonction IA (aucune clé API dans cet environnement). Le schéma SQL et la fonction n’ont pas encore été exécutés.

## Contenu

33 activités (A1 à C2, 5 compétences), 12 fiches pédagogiques, 8 fiches d’examen. Tous les textes et sujets sont originaux ; aucun sujet officiel n’est repris. Les durées et barèmes sont indicatifs et doivent être vérifiés sur les sites officiels. **Relecture par un examinateur humain requise avant ouverture au public.**

Les audios de compréhension orale utilisent provisoirement la synthèse vocale du navigateur ; il est prévu de les remplacer par de vrais enregistrements.
