# Tremplin FLE

Application web de préparation aux examens de français langue étrangère, en autonomie **et** avec son professeur.

- **Élève** : test de niveau, fiches des 8 examens (DELF, DALF, TCF, TCF Québec, TEF, Ev@lang, DFP de la CCI Paris, Certificat Voltaire), niveaux A1 à C2 avec fiches pédagogiques, révisions thématiques (lexique, cartes de mémorisation, quiz), banque d’activités corrigées, examens blancs notés sur 100, retours de l’IA sur l’écrit et l’oral, plan d’amélioration relié aux contenus, objectif et compte à rebours avant l’examen.
- **Professeur** : tableau de bord avec alertes (productions à corriger, devoirs en retard, élèves inactifs, messages non lus), mêmes progrès que l’élève, commentaire et note sur chaque activité, devoirs ciblés (y compris un examen blanc entier), pistes d’exploitation en classe sous chaque fiche, messagerie.
- **Lien élève ↔ professeur par courriel, dans les deux sens.** Le lien n’opère que si les deux comptes ont un accès valide (essai de 14 jours, abonnement ou code d’activation). Aucune commission sur les cours : chacun paie seulement son propre accès.

## Démarrer

```bash
npm install
npm run dev          # http://localhost:5173
```

Sans configuration, l’application tourne en **mode démonstration** : les données restent dans le navigateur, l’IA renvoie un retour simplifié et le tuteur répond à partir des fiches. On peut créer un compte élève puis un compte professeur dans le même navigateur pour tester le lien. Codes d’activation de démonstration : `DEMO-30`, `DEMO-365`, `DEMO-EXPIRE` (simule un accès expiré).

## Vérifications

```bash
npm run typecheck      # TypeScript
npm run check:content  # cohérence du contenu, notation, test de niveau, plan, recherche
npm run build && npx vite preview --port 4173 & node scripts/e2e.cjs   # parcours complet dans Chromium
PGHOST=… PGPORT=… PGUSER=postgres supabase/tests/run.sh               # migrations et règles de sécurité (PostgreSQL 16)
```

GitHub Actions exécute les vérifications de types, de contenu, la compilation et les tests de la base à chaque modification, et publie la démo sur GitHub Pages à chaque fusion dans `main`.

## Contenu

| Élément | Quantité |
| --- | --- |
| Fiches d’examen | 8 |
| Fiches pédagogiques (avec piste pour le professeur) | 30, de A1 à C2 |
| Révisions thématiques (lexique, expressions, texte modèle, quiz) | 18, trois par niveau |
| Activités corrigées (QCM, textes à trous, productions, tâches orales) | 125 |
| Examens blancs complets, notés sur 100 | 4 : DELF A2, B1, B2 et DALF C1 |
| Test de niveau | 24 questions graduées (A1 à C2) |

Tous les textes et sujets sont originaux ; aucun sujet officiel n’est repris. Les durées et barèmes sont indicatifs et doivent être vérifiés sur les sites officiels. **Relecture par un examinateur humain requise avant l’ouverture au public** : le cahier de relecture se génère avec `node --experimental-strip-types scripts/export-revision.ts sortie.html`.

### Audios

Les documents de compréhension orale utilisent la synthèse vocale du navigateur, avec une voix par locuteur dans les dialogues (une ligne « Nom : réplique ») et une vitesse réglable. Pour utiliser un vrai enregistrement, déposez le fichier dans `public/audio/` et indiquez-le dans l’activité : `support: { …, fichierAudio: "audio/b1-co-radio.mp3" }`. Le nombre d’écoutes reste limité.

## Architecture

| Pièce | Choix | Fichiers |
| --- | --- | --- |
| Interface | React + TypeScript (Vite), web responsive, thème clair/sombre, installable et consultable hors connexion (PWA) | `src/`, `public/sw.js` |
| Contenu pédagogique | Données typées, versionnées dans le dépôt | `src/data/` |
| Parcours | Prochaine étape, suggestions, plan d’amélioration calculé, recherche dans les fiches | `src/lib/plan.ts`, `src/lib/recherche.ts` |
| Comptes et données | Supabase : connexion par lien magique (PKCE), Postgres avec sécurité par ligne (RLS), temps réel | `supabase/migrations/`, `src/lib/supabaseBackend.ts` |
| Mode démonstration | Même interface de données, stockage local | `src/lib/localBackend.ts` |
| IA | Fonction serveur : correction de l’écrit, retour sur l’oral (transcription), tuteur, plan structuré ; clé protégée, quota mensuel | `supabase/functions/ia/index.ts`, `src/lib/ai.ts` |
| Accès payant | Essai, codes d’activation à usage unique, branchement prévu pour un prestataire de paiement | `supabase/migrations/002_acces_codes_plan.sql` |

Règles de sécurité clés (dans la base, pas seulement dans l’interface) : un professeur ne lit que les données des élèves liés par un lien accepté **et** dont les deux accès sont valides ; seule la personne invitée peut accepter ; sans accès valide, un élève n’enregistre plus de résultats ; personne ne peut modifier son propre accès, générer des codes, lire le journal des paiements ni écrire la note de son professeur ; la suppression d’un compte efface toutes ses données.

## Mise en production

Voir le guide pas à pas (en espagnol) : [docs/PUESTA-EN-LINEA.md](docs/PUESTA-EN-LINEA.md).

## État des tests

- **Navigateur** (`scripts/e2e.cjs`, mode démonstration) : 45 vérifications — pages légales sans compte, test de niveau, objectif et compte à rebours, invitation à partager, QCM, texte à trous, production écrite, prise de parole transcrite et commentée, cartes de mémorisation et quiz, plan relié aux contenus, menu mobile, accès expiré puis code d’activation, alertes du professeur, filtre « à corriger », commentaire et note, devoir assigné puis retiré, examen blanc assigné, pastille de message non lu, tuteur sans IA, export et suppression du compte, absence de défilement horizontal sur téléphone, aucune erreur JavaScript.
- **Base de données** (`supabase/tests/`, PostgreSQL 16) : 62 scénarios de sécurité.
- **Contenu et logique** (`scripts/check-content.ts`) : identifiants, bonnes réponses, typographie, notation façon DELF, estimation du niveau, références du plan, recherche, découpage des dialogues.

**Non testé** : la connexion par lien magique et le temps réel sur un vrai projet Supabase, et les appels réels à l’IA (aucune clé API dans l’environnement de développement).
