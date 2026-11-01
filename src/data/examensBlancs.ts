import type { Activite } from "./activities";
import type { Competence, ExamId, Niveau } from "../lib/types";

/**
 * Examens blancs : enchaînement d’épreuves notées chacune sur 25, total sur 100,
 * avec la règle de réussite du DELF (50/100 et au moins 5/25 par épreuve).
 * Simulacres d’entraînement : documents et questionnaires plus courts que l’examen réel.
 */
export interface EpreuveBlanche {
  competence: Exclude<Competence, "LS">;
  nom: string;
  duree: number; // minutes, indicatif
  activites: string[];
}

export interface ExamenBlanc {
  id: string;
  titre: string;
  examen: ExamId;
  niveau: Niveau;
  theme: string;
  epreuves: EpreuveBlanche[];
}

export const ACTIVITES_EB: Activite[] = [
  // ─────────────── DELF B1 — examen blanc 1 : « Vivre ensemble » ───────────────
  {
    id: "eb-b1-1-co1",
    type: "qcm",
    titre: "DELF B1 blanc 1 — CO, document 1 : à la recherche d’un colocataire",
    niveau: "B1",
    competence: "CO",
    examens: ["delf"],
    theme: "Logement et colocation",
    duree: 8,
    consigne: "Vous allez entendre une conversation. Lisez les questions, puis écoutez (deux écoutes).",
    support: {
      nature: "audio",
      titre: "Conversation",
      ecoutesMax: 2,
      contenu:
        "Bonjour, je vous appelle pour l’annonce de colocation. La chambre est toujours libre ? Oui, oui, elle est libre à partir du premier octobre. L’appartement est à dix minutes à pied de l’université. Nous sommes déjà trois : deux étudiantes et un jeune infirmier qui travaille souvent la nuit. Ah, d’accord. Et le loyer, c’est combien ? Quatre cent vingt euros par mois, plus quarante euros de charges : internet, eau et électricité. Et qu’est-ce que vous attendez d’un nouveau colocataire ? Surtout qu’il respecte le calme le matin, à cause de notre ami infirmier. Et chacun fait le ménage une semaine sur quatre. Très bien. Je peux visiter quand ? Samedi après-midi, si vous voulez. Apportez une pièce d’identité et un justificatif de revenus.",
    },
    items: [
      { q: "La chambre est disponible…", options: ["à partir du 1er octobre", "immédiatement", "à partir du 1er septembre"], bonne: 0, explication: "« elle est libre à partir du premier octobre »." },
      { q: "Combien de personnes vivent déjà dans l’appartement ?", options: ["Trois", "Deux", "Quatre"], bonne: 0, explication: "« Nous sommes déjà trois »." },
      { q: "Le montant total à payer chaque mois est de…", options: ["460 €", "420 €", "40 €"], bonne: 0, explication: "420 € de loyer + 40 € de charges = 460 €." },
      { q: "Pourquoi faut-il être calme le matin ?", options: ["Un colocataire travaille la nuit", "Les étudiantes ont des examens", "Les voisins se plaignent"], bonne: 0, explication: "« à cause de notre ami infirmier » qui « travaille souvent la nuit »." },
      { q: "Pour la visite, il faut apporter…", options: ["une pièce d’identité et un justificatif de revenus", "le premier loyer", "une lettre de motivation"], bonne: 0, explication: "« Apportez une pièce d’identité et un justificatif de revenus »." },
    ],
  },
  {
    id: "eb-b1-1-co2",
    type: "qcm",
    titre: "DELF B1 blanc 1 — CO, document 2 : un jardin partagé",
    niveau: "B1",
    competence: "CO",
    examens: ["delf"],
    theme: "Vie de quartier",
    duree: 8,
    consigne: "Vous allez entendre un extrait d’émission de radio (deux écoutes).",
    support: {
      nature: "audio",
      titre: "Émission « Notre quartier »",
      ecoutesMax: 2,
      contenu:
        "Dans notre émission « Notre quartier », nous partons aujourd’hui à la découverte d’un jardin partagé créé il y a trois ans sur un ancien parking. Au départ, ils étaient six voisins ; aujourd’hui, l’association compte une soixantaine de membres. Chacun cultive une petite parcelle, mais les décisions sont prises ensemble, lors d’une réunion mensuelle. Pour Mireille, retraitée, le jardin a tout changé : « Avant, je ne connaissais personne dans mon immeuble. Maintenant, on se retrouve ici, on échange des graines et des recettes. » Le jardin accueille aussi les écoles du quartier le mardi matin. Seule difficulté : l’eau. L’association demande à la mairie d’installer un récupérateur d’eau de pluie avant l’été prochain.",
    },
    items: [
      { q: "Où le jardin a-t-il été créé ?", options: ["Sur un ancien parking", "Dans un parc municipal", "Sur le toit d’une école"], bonne: 0, explication: "« créé il y a trois ans sur un ancien parking »." },
      { q: "Comment les décisions sont-elles prises ?", options: ["Collectivement, une fois par mois", "Par le président de l’association", "Par la mairie"], bonne: 0, explication: "« les décisions sont prises ensemble, lors d’une réunion mensuelle »." },
      { q: "Selon Mireille, le jardin lui a surtout permis…", options: ["de rencontrer ses voisins", "de faire des économies", "d’apprendre la cuisine"], bonne: 0, explication: "« Avant, je ne connaissais personne dans mon immeuble »." },
      { q: "Quel problème l’association rencontre-t-elle ?", options: ["L’approvisionnement en eau", "Le manque de membres", "Le vol des légumes"], bonne: 0, explication: "« Seule difficulté : l’eau »." },
    ],
  },
  {
    id: "eb-b1-1-ce1",
    type: "qcm",
    titre: "DELF B1 blanc 1 — CE, document 1 : choisir une colocation",
    niveau: "B1",
    competence: "CE",
    examens: ["delf"],
    theme: "Logement et colocation",
    duree: 15,
    consigne: "Vous cherchez une colocation pour vos études à Lyon. Lisez les trois annonces et répondez aux questions.",
    support: {
      nature: "texte",
      titre: "Trois annonces",
      contenu:
        "A — Grande maison avec jardin à 35 minutes du centre en bus. Cinq colocataires, ambiance très festive : soirées fréquentes ! Chambre de 14 m², 380 € charges comprises. Animaux acceptés.\n\nB — Appartement calme au centre-ville, à 5 minutes du métro. Deux colocataires qui travaillent. Chambre de 11 m², 520 € charges comprises. Non-fumeurs uniquement. Pas d’animaux.\n\nC — Appartement lumineux près du campus, accessible à vélo. Trois étudiants en master qui aiment cuisiner ensemble le dimanche. Chambre de 12 m², 450 € charges comprises. Petit animal accepté après discussion.",
    },
    items: [
      { q: "Vous avez un chat et un budget de 460 € maximum. Quelle annonce vous convient le mieux ?", options: ["C", "A", "B"], bonne: 0, explication: "C respecte le budget (450 €) et accepte un petit animal « après discussion » ; A est loin et festive, B dépasse le budget et refuse les animaux." },
      { q: "Quelle annonce convient à une personne qui veut organiser des fêtes ?", options: ["A", "B", "C"], bonne: 0, explication: "A : « ambiance très festive : soirées fréquentes »." },
      { q: "Quel est l’inconvénient principal de l’annonce A pour un étudiant ?", options: ["La distance du centre", "Le prix", "Le refus des animaux"], bonne: 0, explication: "« à 35 minutes du centre en bus »." },
      { q: "Dans l’annonce B, les colocataires sont…", options: ["des personnes qui travaillent", "des étudiants", "des retraités"], bonne: 0, explication: "« Deux colocataires qui travaillent »." },
    ],
  },
  {
    id: "eb-b1-1-ce2",
    type: "qcm",
    titre: "DELF B1 blanc 1 — CE, document 2 : la colocation entre générations",
    niveau: "B1",
    competence: "CE",
    examens: ["delf"],
    theme: "Logement et solidarité",
    duree: 20,
    consigne: "Lisez l’article et répondez aux questions.",
    support: {
      nature: "texte",
      titre: "Sous le même toit, à 70 ans d’écart",
      contenu:
        "Depuis septembre, Inès, 21 ans, étudiante en droit, partage l’appartement de Germaine, 89 ans. Le principe de la colocation intergénérationnelle est simple : une personne âgée propose une chambre à un jeune pour un loyer très modéré, parfois gratuit ; en échange, le jeune assure une présence le soir et rend quelques services, comme faire les courses.\n\n« Au début, j’avais peur de manquer de liberté », reconnaît Inès. Mais une charte, signée par les deux colocataires, fixe les règles : Inès doit être présente cinq soirs par semaine, mais ses week-ends sont libres. De son côté, Germaine apprécie de ne plus être seule : « Elle me raconte ses cours, je lui raconte ma jeunesse. On rit beaucoup. »\n\nLes associations qui organisent ces rencontres insistent toutefois sur un point : il ne s’agit ni d’un emploi ni d’un service de soins. Le jeune n’est pas là pour remplacer une aide à domicile, mais pour créer un lien.",
    },
    items: [
      { q: "Dans la colocation intergénérationnelle, le jeune…", options: ["paie peu et rend quelques services", "est payé pour s’occuper de la personne âgée", "ne paie rien et n’a aucune obligation"], bonne: 0, explication: "« un loyer très modéré, parfois gratuit ; en échange… quelques services »." },
      { q: "Quelle crainte Inès avait-elle au début ?", options: ["Perdre sa liberté", "Ne pas s’entendre avec Germaine", "Payer trop cher"], bonne: 0, explication: "« j’avais peur de manquer de liberté »." },
      { q: "Selon la charte, Inès…", options: ["doit être là cinq soirs par semaine", "doit rester tous les week-ends", "doit cuisiner chaque jour"], bonne: 0, explication: "« présente cinq soirs par semaine, mais ses week-ends sont libres »." },
      { q: "Ce que Germaine apprécie le plus, c’est…", options: ["la compagnie et les échanges", "l’aide pour le ménage", "le loyer qu’elle reçoit"], bonne: 0, explication: "« apprécie de ne plus être seule… On rit beaucoup »." },
      { q: "Selon les associations, le jeune colocataire…", options: ["ne remplace pas une aide à domicile", "doit avoir une formation médicale", "travaille pour l’association"], bonne: 0, explication: "« il ne s’agit ni d’un emploi ni d’un service de soins »." },
    ],
  },
  {
    id: "eb-b1-1-pe",
    type: "production",
    titre: "DELF B1 blanc 1 — Production écrite",
    niveau: "B1",
    competence: "PE",
    examens: ["delf"],
    theme: "Logement et solidarité",
    duree: 45,
    consigne:
      "Le magazine de votre université organise un débat : « Vivre en colocation pendant ses études : une bonne idée ? » Vous écrivez un article pour donner votre opinion, en vous appuyant sur des exemples tirés de votre expérience ou de celle de vos proches (160 mots minimum).",
    motsMin: 160,
    motsMax: 220,
    grille: [
      "Respect de la consigne : article, opinion sur la colocation étudiante",
      "Capacité à présenter des faits et des expériences",
      "Capacité à exprimer sa pensée et à justifier son opinion",
      "Cohérence et cohésion (paragraphes, connecteurs)",
      "Étendue et maîtrise du lexique, de la morphosyntaxe et de l’orthographe",
    ],
  },
  {
    id: "eb-b1-1-po1",
    type: "oral",
    titre: "DELF B1 blanc 1 — PO, partie 1 : entretien dirigé",
    niveau: "B1",
    competence: "PO",
    examens: ["delf"],
    theme: "Présentation",
    duree: 3,
    consigne: "Sans préparation. L’examinateur vous pose des questions sur vous : vos études ou votre travail, votre logement, vos loisirs, vos projets. Parlez 2 à 3 minutes.",
    preparation: 0,
    parole: 3,
    points: ["J’ai parlé de mes études ou de mon travail", "J’ai décrit mon logement et avec qui je vis", "J’ai parlé de mes loisirs en donnant des détails", "J’ai présenté un projet (futur proche, futur simple)", "J’ai répondu par des phrases complètes, sans me limiter à « oui » ou « non »"],
    aide: ["Actuellement, je fais des études de… / je travaille comme…", "J’habite dans un appartement que je partage avec…", "Pendant mon temps libre, j’aime… parce que…", "L’année prochaine, j’aimerais / je vais…"],
  },
  {
    id: "eb-b1-1-po2",
    type: "oral",
    titre: "DELF B1 blanc 1 — PO, partie 2 : exercice en interaction",
    niveau: "B1",
    competence: "PO",
    examens: ["delf"],
    theme: "Logement et colocation",
    duree: 4,
    consigne: "Sans préparation. Vous vivez en colocation. Votre colocataire (l’examinateur) laisse toujours la vaisselle sale dans la cuisine. Vous lui en parlez pour trouver une solution ensemble. Durée : 3 à 4 minutes.",
    preparation: 0,
    parole: 4,
    points: ["J’ai exposé le problème poliment", "J’ai donné des exemples concrets", "J’ai écouté et réagi aux arguments de l’autre", "J’ai proposé au moins une solution (planning, règles…)", "Nous avons conclu par un accord"],
    aide: ["Écoute, je voudrais te parler de quelque chose…", "Ce n’est pas la première fois que…", "Je comprends, mais…", "Et si on faisait un planning ?", "D’accord, alors on fait comme ça."],
  },
  {
    id: "eb-b1-1-po3",
    type: "oral",
    titre: "DELF B1 blanc 1 — PO, partie 3 : expression d’un point de vue",
    niveau: "B1",
    competence: "PO",
    examens: ["delf"],
    theme: "Logement et solidarité",
    duree: 15,
    consigne: "Préparation : 10 minutes. Document : « Dans plusieurs villes, des étudiants logent gratuitement chez des personnes âgées en échange de leur présence. » Dégagez le thème, puis présentez votre opinion de façon claire et argumentée (3 minutes), avant de répondre aux questions de l’examinateur.",
    preparation: 10,
    parole: 7,
    points: ["J’ai présenté le thème du document", "J’ai annoncé clairement mon opinion", "J’ai développé au moins deux arguments avec des exemples", "J’ai organisé mon discours avec des connecteurs", "J’ai répondu aux questions de l’examinateur"],
    aide: ["Le document parle de…", "Je trouve que c’est une bonne idée, car…", "D’abord… Ensuite… Enfin…", "Par exemple, ma grand-mère…", "Pour conclure, …"],
  },

  // ─────────────── DELF B2 — examen blanc 1 : « Vie numérique » ───────────────
  {
    id: "eb-b2-1-co1",
    type: "qcm",
    titre: "DELF B2 blanc 1 — CO, document 1 : le droit à l’oubli numérique",
    niveau: "B2",
    competence: "CO",
    examens: ["delf"],
    theme: "Réseaux sociaux et vie privée",
    duree: 12,
    consigne: "Vous allez entendre un entretien radiophonique (deux écoutes). Lisez d’abord les questions.",
    support: {
      nature: "audio",
      titre: "Entretien",
      ecoutesMax: 2,
      contenu:
        "Journaliste : Maître Lefèvre, vous êtes avocate spécialisée dans le numérique. Que peut faire quelqu’un qui découvre une vieille photo gênante de lui en ligne ? Avocate : La première démarche, la plus efficace, consiste à demander directement à la personne qui l’a publiée de la retirer. Dans la plupart des cas, cela suffit. Si ce n’est pas le cas, on peut s’adresser à la plateforme, qui est tenue d’examiner la demande. Journaliste : Et si la plateforme refuse ? Avocate : On peut alors saisir l’autorité chargée de la protection des données. Mais attention, le droit à l’oubli n’est pas absolu : il doit être mis en balance avec le droit à l’information. Un responsable politique, par exemple, ne pourra pas faire disparaître des articles sur son action publique. Journaliste : Quel conseil donneriez-vous aux jeunes ? Avocate : De se poser une question simple avant de publier : est-ce que j’accepterais que mon futur employeur voie cette image dans dix ans ?",
    },
    items: [
      { q: "Selon l’avocate, la première démarche à faire est de…", options: ["contacter la personne qui a publié la photo", "porter plainte", "écrire à la plateforme"], bonne: 0, explication: "« demander directement à la personne qui l’a publiée de la retirer »." },
      { q: "En cas de refus de la plateforme, on peut…", options: ["saisir l’autorité de protection des données", "supprimer soi-même la photo", "rien faire de plus"], bonne: 0, explication: "« On peut alors saisir l’autorité chargée de la protection des données »." },
      { q: "Pourquoi le droit à l’oubli « n’est pas absolu » ?", options: ["Il doit être concilié avec le droit à l’information", "Il ne concerne que les mineurs", "Il coûte trop cher"], bonne: 0, explication: "« il doit être mis en balance avec le droit à l’information »." },
      { q: "L’exemple du responsable politique illustre…", options: ["une limite du droit à l’oubli", "un cas de harcèlement", "une démarche réussie"], bonne: 0, explication: "Il « ne pourra pas faire disparaître des articles sur son action publique »." },
      { q: "Le conseil final de l’avocate invite à…", options: ["anticiper les conséquences futures d’une publication", "ne jamais utiliser les réseaux sociaux", "publier sous un pseudonyme"], bonne: 0, explication: "« est-ce que j’accepterais que mon futur employeur voie cette image dans dix ans ? »." },
    ],
  },
  {
    id: "eb-b2-1-co2",
    type: "qcm",
    titre: "DELF B2 blanc 1 — CO, document 2 : déconnexion des adolescents",
    niveau: "B2",
    competence: "CO",
    examens: ["delf"],
    theme: "Réseaux sociaux et éducation",
    duree: 10,
    consigne: "Vous allez entendre un reportage. Une seule écoute : entraînez-vous à repérer l’essentiel du premier coup.",
    support: {
      nature: "audio",
      titre: "Reportage",
      ecoutesMax: 1,
      contenu:
        "Dans ce collège de Bretagne, les téléphones restent dans un casier de huit heures à seize heures trente. La mesure, prise il y a deux ans, avait d’abord suscité la colère de nombreux parents, inquiets de ne pas pouvoir joindre leurs enfants. Aujourd’hui, la principale dresse un bilan positif : les conflits dans la cour ont diminué de moitié et les élèves jouent davantage ensemble. Certains enseignants restent pourtant sceptiques : selon eux, interdire ne suffit pas, il faut aussi apprendre aux jeunes à gérer leur temps d’écran, car ils retrouvent leur téléphone dès la sortie.",
    },
    items: [
      { q: "Au début, de nombreux parents étaient…", options: ["opposés à la mesure", "indifférents", "à l’origine de la mesure"], bonne: 0, explication: "« avait d’abord suscité la colère de nombreux parents »." },
      { q: "Quel résultat la principale observe-t-elle ?", options: ["Moins de conflits entre élèves", "De meilleures notes en mathématiques", "Moins d’absences"], bonne: 0, explication: "« les conflits dans la cour ont diminué de moitié »." },
      { q: "Les enseignants sceptiques pensent que…", options: ["l’interdiction doit s’accompagner d’une éducation au numérique", "il faut supprimer la mesure", "les parents doivent confisquer les téléphones"], bonne: 0, explication: "« interdire ne suffit pas, il faut aussi apprendre aux jeunes à gérer leur temps d’écran »." },
    ],
  },
  {
    id: "eb-b2-1-ce1",
    type: "qcm",
    titre: "DELF B2 blanc 1 — CE : faut-il interdire les réseaux sociaux avant 15 ans ?",
    niveau: "B2",
    competence: "CE",
    examens: ["delf"],
    theme: "Réseaux sociaux et vie privée",
    duree: 30,
    consigne: "Lisez cette tribune et répondez aux questions.",
    support: {
      nature: "texte",
      titre: "Majorité numérique : une fausse bonne idée ?",
      contenu:
        "L’idée revient régulièrement dans le débat public : interdire l’accès aux réseaux sociaux avant quinze ans. L’intention est louable. Les études s’accumulent sur les effets d’une exposition précoce : troubles du sommeil, comparaison permanente, exposition à des contenus violents. Qui oserait prétendre que les plateformes protègent suffisamment les plus jeunes ?\n\nPourtant, l’interdiction se heurte à un obstacle de taille : son application. Comment vérifier l’âge des utilisateurs sans collecter davantage de données personnelles, ce que l’on cherche précisément à éviter ? Les adolescents, qui maîtrisent souvent mieux les outils que leurs parents, contourneront sans peine les contrôles. On risque alors de repousser les usages vers des espaces encore moins régulés.\n\nPlutôt que de fermer la porte, il serait plus efficace d’imposer aux plateformes des obligations précises : paramètres protecteurs activés par défaut pour les mineurs, fin des fils d’actualité infinis, transparence sur les algorithmes. Et surtout, de faire de l’éducation aux médias une matière à part entière, dès l’école primaire. Car un adolescent qui comprend comment l’attention est captée est mieux armé que celui à qui l’on a simplement interdit d’entrer.",
    },
    items: [
      { q: "Quelle est la position de l’auteur sur l’interdiction avant 15 ans ?", options: ["Il comprend l’intention mais doute de son efficacité", "Il la soutient sans réserve", "Il nie les risques des réseaux sociaux"], bonne: 0, explication: "« L’intention est louable » puis « Pourtant, l’interdiction se heurte à un obstacle de taille »." },
      { q: "La question « Qui oserait prétendre… ? » sert à…", options: ["souligner que la protection actuelle est insuffisante", "demander l’avis du lecteur", "défendre les plateformes"], bonne: 0, explication: "Question rhétorique : personne ne peut affirmer que les plateformes protègent suffisamment les jeunes." },
      { q: "Quel paradoxe l’auteur relève-t-il au sujet de la vérification de l’âge ?", options: ["Elle obligerait à collecter plus de données personnelles", "Elle serait trop facile à mettre en place", "Elle concernerait aussi les adultes"], bonne: 0, explication: "« sans collecter davantage de données personnelles, ce que l’on cherche précisément à éviter »." },
      { q: "Selon l’auteur, une interdiction risquerait de…", options: ["déplacer les usages vers des espaces moins contrôlés", "réduire le temps d’écran", "rapprocher parents et enfants"], bonne: 0, explication: "« repousser les usages vers des espaces encore moins régulés »." },
      { q: "Parmi ses propositions, l’auteur cite…", options: ["des paramètres protecteurs activés par défaut", "la fermeture des réseaux sociaux la nuit", "un permis de conduire numérique"], bonne: 0, explication: "« paramètres protecteurs activés par défaut pour les mineurs »." },
      { q: "La dernière phrase oppose…", options: ["comprendre et se voir interdire", "les parents et les enseignants", "l’école primaire et le collège"], bonne: 0, explication: "Un adolescent « qui comprend » est « mieux armé que celui à qui l’on a simplement interdit d’entrer »." },
    ],
  },
  {
    id: "eb-b2-1-ce2",
    type: "qcm",
    titre: "DELF B2 blanc 1 — CE, document 2 : règlement d’un concours",
    niveau: "B2",
    competence: "CE",
    examens: ["delf"],
    theme: "Création numérique",
    duree: 20,
    consigne: "Vous souhaitez participer à ce concours. Lisez le règlement et répondez aux questions.",
    support: {
      nature: "texte",
      titre: "Concours « Regards sur ma ville » — extrait du règlement",
      contenu:
        "Article 1 — Le concours est ouvert à toute personne majeure résidant dans la région, à l’exception des membres du jury et de leur famille.\n\nArticle 2 — Chaque participant peut envoyer au maximum deux photographies, prises au cours des douze derniers mois. Les montages et retouches importantes sont interdits ; seuls les réglages de lumière et de contraste sont tolérés.\n\nArticle 3 — Si une personne est reconnaissable sur la photographie, le participant doit joindre son autorisation écrite. À défaut, la photographie sera écartée.\n\nArticle 4 — Les lauréats autorisent l’organisateur à exposer et à publier leurs photographies, avec mention de leur nom, pendant deux ans, sans rémunération. Le participant reste propriétaire de ses droits d’auteur.",
    },
    items: [
      { q: "Peut-on participer si l’on a 17 ans ?", options: ["Non, il faut être majeur", "Oui, avec l’accord des parents", "Oui, sans condition"], bonne: 0, explication: "Article 1 : « toute personne majeure »." },
      { q: "Quelle photo est acceptée ?", options: ["Une photo d’il y a six mois avec un contraste ajusté", "Un montage de deux photos", "Une photo prise il y a deux ans"], bonne: 0, explication: "Article 2 : moins de douze mois ; seuls lumière et contraste sont tolérés." },
      { q: "Si votre voisin est reconnaissable sur la photo, vous devez…", options: ["fournir son autorisation écrite", "flouter son visage", "le signaler au jury"], bonne: 0, explication: "Article 3 : « joindre son autorisation écrite »." },
      { q: "Si vous gagnez, l’organisateur pourra…", options: ["publier votre photo pendant deux ans sans vous payer", "vendre votre photo", "devenir propriétaire de vos droits d’auteur"], bonne: 0, explication: "Article 4 : publication pendant deux ans « sans rémunération » ; vous restez propriétaire de vos droits." },
    ],
  },
  {
    id: "eb-b2-1-pe",
    type: "production",
    titre: "DELF B2 blanc 1 — Production écrite",
    niveau: "B2",
    competence: "PE",
    examens: ["delf"],
    theme: "Réseaux sociaux et éducation",
    duree: 60,
    consigne:
      "Le conseil d’administration du lycée de votre ville envisage d’interdire totalement les téléphones portables dans l’établissement, y compris pendant les pauses. En tant que représentant(e) des parents d’élèves, vous écrivez une lettre au proviseur pour donner votre position. Vous reconnaissez les arguments favorables à la mesure, puis vous défendez votre point de vue et proposez une solution (250 mots minimum).",
    motsMin: 250,
    motsMax: 320,
    grille: [
      "Respect de la consigne : lettre formelle au proviseur, position argumentée, proposition",
      "Capacité à argumenter une prise de position (thèse, concession, réfutation)",
      "Cohérence et cohésion : plan clair, connecteurs variés",
      "Codes de la lettre formelle (objet, formules d’appel et de politesse)",
      "Étendue et maîtrise du lexique, de la morphosyntaxe et de l’orthographe",
    ],
  },
  {
    id: "eb-b2-1-po",
    type: "oral",
    titre: "DELF B2 blanc 1 — Production orale : exposé et débat",
    niveau: "B2",
    competence: "PO",
    examens: ["delf"],
    theme: "Réseaux sociaux et vie privée",
    duree: 50,
    consigne:
      "Préparation : 30 minutes. Document déclencheur : « Selon une enquête récente, sept jeunes sur dix ont déjà regretté une publication sur les réseaux sociaux. » Dégagez une problématique, présentez un exposé argumenté (5 à 7 minutes), puis défendez votre point de vue face aux objections de l’examinateur (10 à 13 minutes).",
    preparation: 30,
    parole: 20,
    points: [
      "J’ai présenté le document et formulé une problématique",
      "J’ai annoncé un plan et je l’ai suivi",
      "J’ai développé des arguments illustrés d’exemples précis",
      "J’ai intégré une concession (certes…, toutefois…)",
      "J’ai conclu en répondant à ma problématique",
      "Pendant le débat, j’ai défendu et nuancé ma position",
    ],
    aide: ["Ce document soulève la question suivante : …", "Dans un premier temps, j’examinerai… ; dans un second temps…", "Il est vrai que… ; toutefois…", "Prenons l’exemple de…", "Je ne partage pas tout à fait votre avis, dans la mesure où…"],
  },
];

export const EXAMENS_BLANCS: ExamenBlanc[] = [
  {
    id: "delf-b1-1",
    titre: "DELF B1 — examen blanc 1",
    examen: "delf",
    niveau: "B1",
    theme: "Vivre ensemble",
    epreuves: [
      { competence: "CO", nom: "Compréhension de l’oral", duree: 25, activites: ["eb-b1-1-co1", "eb-b1-1-co2"] },
      { competence: "CE", nom: "Compréhension des écrits", duree: 45, activites: ["eb-b1-1-ce1", "eb-b1-1-ce2"] },
      { competence: "PE", nom: "Production écrite", duree: 45, activites: ["eb-b1-1-pe"] },
      { competence: "PO", nom: "Production orale", duree: 25, activites: ["eb-b1-1-po1", "eb-b1-1-po2", "eb-b1-1-po3"] },
    ],
  },
  {
    id: "delf-b2-1",
    titre: "DELF B2 — examen blanc 1",
    examen: "delf",
    niveau: "B2",
    theme: "Vie numérique",
    epreuves: [
      { competence: "CO", nom: "Compréhension de l’oral", duree: 30, activites: ["eb-b2-1-co1", "eb-b2-1-co2"] },
      { competence: "CE", nom: "Compréhension des écrits", duree: 60, activites: ["eb-b2-1-ce1", "eb-b2-1-ce2"] },
      { competence: "PE", nom: "Production écrite", duree: 60, activites: ["eb-b2-1-pe"] },
      { competence: "PO", nom: "Production orale", duree: 50, activites: ["eb-b2-1-po"] },
    ],
  },
];

export const examenBlanc = (id: string) => EXAMENS_BLANCS.find((e) => e.id === id);
