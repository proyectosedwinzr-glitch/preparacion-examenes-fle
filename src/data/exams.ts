import type { Competence, ExamId, Niveau } from "../lib/types";

export interface Epreuve {
  competence: Competence;
  nom: string;
  duree: string;
  format: string;
  /** Ce que l’épreuve évalue réellement. */
  evalue: string[];
}

export interface FicheExamen {
  id: ExamId;
  nom: string;
  nomComplet: string;
  organisme: string;
  lienOfficiel: string;
  public: string;
  niveaux: Niveau[];
  usages: string[];
  resultat: string;
  validite: string;
  epreuves: Epreuve[];
  exemple: { epreuve: string; consigne: string; attendu: string };
  conseils: string[];
  pieges: string[];
}

export const AVERTISSEMENT_EXAMENS =
  "Durées, nombres de questions et barèmes sont donnés à titre indicatif : les organismes certificateurs les font évoluer. Vérifiez toujours le format en vigueur sur le site officiel avant votre inscription.";

export const EXAMENS: FicheExamen[] = [
  {
    id: "delf",
    nom: "DELF",
    nomComplet: "Diplôme d’études en langue française",
    organisme: "France Éducation international (ministère de l’Éducation nationale)",
    lienOfficiel: "https://www.france-education-international.fr/diplome/delf-tout-public",
    public: "Tout public, avec des déclinaisons Prim, Junior/scolaire et Pro.",
    niveaux: ["A1", "A2", "B1", "B2"],
    usages: [
      "Diplôme officiel valable à vie, reconnu dans le monde entier.",
      "B2 : niveau souvent exigé pour l’entrée à l’université en France.",
      "A2 ou B1 : niveaux exigés dans certaines démarches de titre de séjour ou de naturalisation en France (vérifier la réglementation en vigueur).",
    ],
    resultat: "Chaque épreuve est notée sur 25, total sur 100. Le diplôme est obtenu avec au moins 50/100 et au minimum 5/25 dans chaque épreuve.",
    validite: "À vie.",
    epreuves: [
      { competence: "CO", nom: "Compréhension de l’oral", duree: "A1 : 20 min · A2 : 25 min · B1 : 25 min · B2 : 30 min", format: "Questionnaires sur plusieurs documents enregistrés (annonces, messages, interviews, émissions), écoutés une ou deux fois.", evalue: ["Comprendre l’information essentielle et des détails précis", "Identifier la situation, les interlocuteurs et leur intention", "B2 : suivre une argumentation et repérer les opinions"] },
      { competence: "CE", nom: "Compréhension des écrits", duree: "A1 : 30 min · A2 : 30 min · B1 : 45 min · B2 : 1 h", format: "Questionnaires sur des documents écrits authentiques ou semi-authentiques.", evalue: ["Repérer des informations utiles", "Comprendre la structure et la visée d’un texte", "B1-B2 : distinguer faits et opinions, comprendre un texte argumentatif"] },
      { competence: "PE", nom: "Production écrite", duree: "A1 : 30 min · A2 : 45 min · B1 : 45 min · B2 : 1 h", format: "A1-A2 : formulaire, message, courte lettre. B1 : essai, article ou courrier exprimant une opinion (160 mots minimum). B2 : texte argumenté — lettre formelle, article, contribution (250 mots minimum).", evalue: ["Respect de la consigne et du genre de texte", "Capacité à argumenter (B1-B2)", "Cohérence et cohésion", "Étendue et maîtrise du lexique et de la grammaire"] },
      { competence: "PO", nom: "Production orale", duree: "A1 : 5-7 min · A2 : 6-8 min · B1 : environ 15 min · B2 : environ 20 min (préparation : 10 min de A1 à B1, 30 min en B2)", format: "Entretien dirigé, échange d’informations, monologue suivi, jeu de rôle (A1-B1) ; en B2, exposé d’un point de vue à partir d’un document déclencheur puis débat avec l’examinateur.", evalue: ["Se présenter et interagir", "Présenter et défendre un point de vue (B1-B2)", "Lexique, correction grammaticale, prononciation et fluidité"] },
    ],
    exemple: {
      epreuve: "Production écrite B1",
      consigne: "Sur le forum de votre ville, on débat d’un projet : interdire les voitures dans le centre le week-end. Vous donnez votre avis en expliquant les avantages et les inconvénients du projet (160 mots minimum).",
      attendu: "Un message de forum structuré : présentation du sujet, opinion claire, deux ou trois arguments illustrés d’exemples, connecteurs logiques, conclusion.",
    },
    conseils: [
      "Gérez le temps : lisez toutes les questions de CO avant la première écoute.",
      "En PE, comptez vos mots : un texte trop court est pénalisé.",
      "Respectez le genre demandé (lettre, article, message) avec ses codes : formule d’appel, titre, signature…",
      "En PO B2, annoncez votre plan dès l’introduction : l’examinateur suit mieux votre raisonnement.",
      "Ne laissez aucune question sans réponse : les mauvaises réponses ne retirent pas de points.",
    ],
    pieges: [
      "Recopier des phrases entières du document déclencheur en PO ou en PE.",
      "Confondre registre familier et registre standard dans un courrier formel.",
      "Oublier qu’une note inférieure à 5/25 dans une seule épreuve fait échouer, même avec 50/100.",
    ],
  },
  {
    id: "dalf",
    nom: "DALF",
    nomComplet: "Diplôme approfondi de langue française",
    organisme: "France Éducation international",
    lienOfficiel: "https://www.france-education-international.fr/diplome/dalf",
    public: "Apprenants avancés : études supérieures, carrières qui exigent un français expert.",
    niveaux: ["C1", "C2"],
    usages: ["Dispense de test linguistique dans les universités françaises.", "Valorisation professionnelle d’un niveau autonome ou de maîtrise."],
    resultat: "C1 : quatre épreuves sur 25, total sur 100. C2 : deux épreuves sur 50, total sur 100. Réussite à 50/100, avec un minimum par épreuve (5/25 en C1, 10/50 en C2).",
    validite: "À vie.",
    epreuves: [
      { competence: "CO", nom: "Compréhension de l’oral (C1)", duree: "Environ 40 min", format: "Un document long (conférence, débat) et plusieurs documents courts.", evalue: ["Suivre un discours long et structuré", "Saisir les implicites, les nuances et les attitudes"] },
      { competence: "CE", nom: "Compréhension des écrits (C1)", duree: "50 min", format: "Texte long, littéraire ou journalistique, au choix du domaine (lettres et sciences humaines, ou sciences).", evalue: ["Comprendre un texte long et complexe", "Analyser l’argumentation et le point de vue de l’auteur"] },
      { competence: "PE", nom: "Production écrite (C1)", duree: "2 h 30", format: "Synthèse d’un dossier documentaire (environ 220 mots), puis essai argumenté (environ 250 mots).", evalue: ["Reformuler sans recopier, hiérarchiser les informations", "Argumenter de manière nuancée et structurée"] },
      { competence: "PO", nom: "Production orale (C1)", duree: "30 min (préparation : 1 h)", format: "Exposé à partir d’un dossier de documents, puis entretien avec le jury.", evalue: ["Construire un exposé problématisé", "Défendre et nuancer sa position face aux questions"] },
    ],
    exemple: {
      epreuve: "Production écrite C1 — essai",
      consigne: "Le télétravail doit-il devenir la norme pour les métiers qui le permettent ? Vous rédigez un article argumenté pour le magazine d’une association professionnelle (environ 250 mots).",
      attendu: "Un titre, une introduction qui pose la problématique, une argumentation nuancée (thèse, concessions, réfutation), une conclusion ouverte, un registre soutenu.",
    },
    conseils: [
      "La synthèse ne contient aucune opinion personnelle et ne cite pas les documents mot pour mot.",
      "Travaillez la problématisation : une question claire guide tout l’exposé oral.",
      "En C2, l’oral commence par l’écoute d’un document : prenez des notes structurées.",
    ],
    pieges: ["Donner son avis dans la synthèse.", "Dépasser largement la longueur demandée : la concision fait partie de la compétence."],
  },
  {
    id: "tcf",
    nom: "TCF",
    nomComplet: "Test de connaissance du français",
    organisme: "France Éducation international",
    lienOfficiel: "https://www.france-education-international.fr/test/tcf-tout-public",
    public: "Tout public ; déclinaisons TCF Canada, TCF Québec, TCF IRN (intégration, résidence, nationalité) et TCF pour la demande d’admission préalable (DAP).",
    niveaux: ["A1", "A2", "B1", "B2", "C1", "C2"],
    usages: ["Études, démarches administratives, immigration (Canada : TCF Canada).", "Positionnement du niveau sans notion de réussite ou d’échec."],
    resultat: "Les épreuves à choix multiple donnent un score de 100 à 699, converti en niveau du CECRL ; les productions sont notées sur 20. Pour le Canada, les résultats sont aussi convertis en NCLC.",
    validite: "Attestation valable 2 ans.",
    epreuves: [
      { competence: "CO", nom: "Compréhension orale", duree: "Environ 35 min", format: "39 questions à choix multiple, de difficulté croissante (A1 à C2), une seule écoute.", evalue: ["Comprendre des échanges du quotidien jusqu’à des discours complexes"] },
      { competence: "CE", nom: "Compréhension écrite", duree: "60 min", format: "39 questions à choix multiple, de difficulté croissante.", evalue: ["Comprendre des écrits courants jusqu’à des textes abstraits"] },
      { competence: "LS", nom: "Maîtrise des structures de la langue", duree: "Environ 15 min", format: "Questions à choix multiple de grammaire et de lexique (selon la déclinaison du test).", evalue: ["Grammaire et lexique en contexte"] },
      { competence: "PE", nom: "Expression écrite", duree: "60 min", format: "3 tâches : un message (60 à 120 mots), un article ou compte rendu (120 à 150 mots), une comparaison de deux points de vue avec prise de position (120 à 180 mots).", evalue: ["Adapter le texte à la situation", "Décrire, raconter, comparer, argumenter"] },
      { competence: "PO", nom: "Expression orale", duree: "Environ 12 min", format: "3 tâches : entretien dirigé, exercice en interaction (avec préparation courte), expression d’un point de vue.", evalue: ["Parler de soi", "Obtenir des informations", "Défendre une opinion de façon structurée"] },
    ],
    exemple: {
      epreuve: "Expression écrite, tâche 3",
      consigne: "Deux opinions s’opposent sur l’usage du téléphone portable à l’école. Résumez les deux points de vue puis donnez le vôtre en justifiant (120 à 180 mots).",
      attendu: "Une reformulation neutre des deux positions, puis une prise de position argumentée, avec des connecteurs d’opposition et de conséquence.",
    },
    conseils: [
      "Les questions vont du plus facile au plus difficile : ne perdez pas de temps au début, mais ne bâclez pas la fin.",
      "Respectez strictement les fourchettes de mots de chaque tâche écrite.",
      "En tâche 2 de l’oral, c’est vous qui posez les questions : variez les formes interrogatives.",
    ],
    pieges: ["Écrire hors des fourchettes de mots.", "Oublier que l’écoute est unique : la concentration compte autant que le niveau."],
  },
  {
    id: "tcfq",
    nom: "TCF Québec",
    nomComplet: "Test de connaissance du français pour le Québec",
    organisme: "France Éducation international",
    lienOfficiel: "https://www.france-education-international.fr/test/tcf-quebec",
    public: "Personnes qui déposent un dossier d’immigration au Québec (ministère de l’Immigration, de la Francisation et de l’Intégration).",
    niveaux: ["A1", "A2", "B1", "B2", "C1", "C2"],
    usages: ["Démarches d’immigration économique et de sélection au Québec.", "Le candidat choisit les épreuves exigées par sa démarche (format modulaire)."],
    resultat: "Même format et même échelle que le TCF : score de 100 à 699 pour les épreuves à choix multiple, note sur 20 pour les productions, niveau du CECRL.",
    validite: "Attestation valable 2 ans.",
    epreuves: [
      { competence: "CO", nom: "Compréhension orale", duree: "Environ 35 min", format: "39 questions à choix multiple.", evalue: ["Comprendre des situations de vie et de travail"] },
      { competence: "CE", nom: "Compréhension écrite", duree: "60 min", format: "39 questions à choix multiple.", evalue: ["Comprendre des écrits courants et professionnels"] },
      { competence: "PE", nom: "Expression écrite", duree: "60 min", format: "3 tâches, comme au TCF.", evalue: ["Informer, raconter, argumenter"] },
      { competence: "PO", nom: "Expression orale", duree: "Environ 12 min", format: "3 tâches, comme au TCF.", evalue: ["Interagir, s’informer, défendre une opinion"] },
    ],
    exemple: {
      epreuve: "Expression orale, tâche 2",
      consigne: "Vous venez d’arriver à Montréal et vous cherchez un logement. Vous appelez une agence : posez des questions sur le loyer, le quartier, les transports et les conditions de location.",
      attendu: "Des questions variées et polies (est-ce que, inversion, quel/quelle), des relances et une conclusion de l’échange.",
    },
    conseils: [
      "Vérifiez sur le site du ministère québécois les épreuves et le niveau exigés pour votre programme.",
      "Familiarisez-vous avec des documents québécois : annonces, radio, vocabulaire du logement et du travail.",
    ],
    pieges: ["S’inscrire à une épreuve qui n’est pas exigée, ou en oublier une.", "Penser que le TCF Québec et le TCF Canada sont interchangeables : ce sont deux tests distincts."],
  },
  {
    id: "tef",
    nom: "TEF",
    nomComplet: "Test d’évaluation de français",
    organisme: "Le français des affaires — CCI Paris Île-de-France",
    lienOfficiel: "https://www.lefrancaisdesaffaires.fr/tests-diplomes/test-evaluation-francais-tef/",
    public: "Tout public ; déclinaisons TEF Canada, TEF Québec (TEFAQ), TEF IRN, TEF Études.",
    niveaux: ["A1", "A2", "B1", "B2", "C1", "C2"],
    usages: ["Immigration au Canada et au Québec.", "Naturalisation et carte de résident en France (TEF IRN).", "Admission dans l’enseignement supérieur (TEF Études)."],
    resultat: "Score par épreuve converti en niveau du CECRL et, pour le Canada, en NCLC. Les échelles de score varient selon la déclinaison : consulter le site officiel.",
    validite: "Attestation valable 2 ans.",
    epreuves: [
      { competence: "CO", nom: "Compréhension de l’oral", duree: "40 min", format: "Questions à choix multiple sur des documents de difficulté croissante (nombre de questions selon la version en vigueur).", evalue: ["Comprendre des messages du quotidien jusqu’à des débats"] },
      { competence: "CE", nom: "Compréhension des écrits", duree: "60 min", format: "Questions à choix multiple (nombre selon la version en vigueur).", evalue: ["Repérer, comprendre, interpréter des écrits variés"] },
      { competence: "PE", nom: "Expression écrite", duree: "60 min", format: "2 sujets : section A, rédiger la suite d’un article de presse (environ 80 mots minimum) ; section B, écrire une lettre ou un texte qui défend un point de vue (environ 200 mots minimum).", evalue: ["Raconter de façon cohérente", "Argumenter pour convaincre"] },
      { competence: "PO", nom: "Expression orale", duree: "15 min", format: "2 sections face à un examinateur : A, obtenir des informations à partir d’une annonce ; B, présenter une offre et convaincre un ami.", evalue: ["Poser des questions pertinentes", "Argumenter et répondre aux objections"] },
    ],
    exemple: {
      epreuve: "Expression orale, section B",
      consigne: "Vous avez vu une annonce pour un stage de cuisine d’une semaine. Vous essayez de convaincre un ami de s’inscrire avec vous ; l’examinateur joue l’ami et fait des objections.",
      attendu: "Présenter l’offre, donner des arguments adaptés à l’ami, répondre à chaque objection sans abandonner, rester naturel.",
    },
    conseils: [
      "En section B de l’oral, préparez trois arguments et anticipez les objections (prix, temps, intérêt).",
      "En section A de l’écrit, gardez le ton et les faits de l’article de départ.",
    ],
    pieges: ["Contredire les informations de l’article dans la suite rédigée.", "Céder trop vite aux objections de l’examinateur."],
  },
  {
    id: "evalang",
    nom: "Ev@lang",
    nomComplet: "Ev@lang — test de positionnement en ligne",
    organisme: "France Éducation international",
    lienOfficiel: "https://www.france-education-international.fr/test/evalang",
    public: "Apprenants, établissements, entreprises et administrations qui ont besoin d’un positionnement rapide.",
    niveaux: ["A1", "A2", "B1", "B2", "C1"],
    usages: ["Positionnement à l’entrée d’une formation.", "Recrutement ou mobilité professionnelle."],
    resultat: "Niveau du CECRL par compétence évaluée ; test adaptatif (la difficulté s’ajuste aux réponses).",
    validite: "Selon l’usage fixé par l’organisme qui demande le test.",
    epreuves: [
      { competence: "CO", nom: "Compréhension orale", duree: "Variable (test adaptatif)", format: "Questions à choix multiple en ligne.", evalue: ["Comprendre des documents sonores de difficulté adaptée"] },
      { competence: "CE", nom: "Compréhension écrite", duree: "Variable", format: "Questions à choix multiple en ligne.", evalue: ["Comprendre des textes de difficulté adaptée"] },
      { competence: "LS", nom: "Grammaire et lexique", duree: "Variable", format: "Questions à choix multiple en ligne.", evalue: ["Maîtrise des structures et du vocabulaire"] },
    ],
    exemple: {
      epreuve: "Grammaire et lexique",
      consigne: "Choisissez la forme correcte : « Il faut que vous … ce dossier avant vendredi. » (finissez / finissiez / finirez)",
      attendu: "« finissiez » : subjonctif présent après « il faut que ».",
    },
    conseils: ["Répondez avec soin dès les premières questions : elles orientent la suite du test adaptatif.", "Passez le test dans un endroit calme, avec un casque."],
    pieges: ["Répondre au hasard trop vite : un test adaptatif sous-estime alors votre niveau."],
  },
  {
    id: "ccip",
    nom: "DFP (CCIP)",
    nomComplet: "Diplômes de français professionnel de la CCI Paris Île-de-France",
    organisme: "Le français des affaires — CCI Paris Île-de-France",
    lienOfficiel: "https://www.lefrancaisdesaffaires.fr/tests-diplomes/diplomes-francais-professionnel-dfp/",
    public: "Professionnels et étudiants qui utilisent le français au travail.",
    niveaux: ["A1", "A2", "B1", "B2", "C1"],
    usages: [
      "Valoriser des compétences en situation professionnelle : DFP généralistes et de spécialité (affaires, tourisme et hôtellerie, secrétariat, santé, juridique, scientifique et technique, relations internationales…).",
    ],
    resultat: "Diplôme obtenu selon un seuil global et des minimums par compétence (barème propre à chaque diplôme).",
    validite: "À vie.",
    epreuves: [
      { competence: "CO", nom: "Compréhension orale", duree: "Selon le diplôme", format: "Documents professionnels : messages, réunions, échanges avec des clients.", evalue: ["Comprendre une situation de travail"] },
      { competence: "CE", nom: "Compréhension écrite", duree: "Selon le diplôme", format: "Courriels, notes, rapports, articles spécialisés.", evalue: ["Extraire et traiter l’information professionnelle"] },
      { competence: "PE", nom: "Production écrite", duree: "Selon le diplôme", format: "Courriel, lettre commerciale, compte rendu, note de synthèse.", evalue: ["Rédiger un écrit professionnel adapté au destinataire"] },
      { competence: "PO", nom: "Production orale", duree: "Selon le diplôme", format: "Simulation de situations professionnelles avec l’examinateur.", evalue: ["Interagir avec des collègues ou des clients", "Présenter, négocier, résoudre un problème"] },
    ],
    exemple: {
      epreuve: "Production écrite B1 (affaires)",
      consigne: "Un client se plaint d’un retard de livraison. Rédigez un courriel pour vous excuser, expliquer la cause du retard et proposer une solution.",
      attendu: "Formules professionnelles, excuses, explication factuelle, proposition concrète, formule de politesse finale.",
    },
    conseils: ["Apprenez les formules figées du courriel professionnel.", "Travaillez le lexique de votre domaine de spécialité."],
    pieges: ["Utiliser le tutoiement ou un ton familier avec un client."],
  },
  {
    id: "voltaire",
    nom: "Certificat Voltaire",
    nomComplet: "Certificat Voltaire — orthographe et expression",
    organisme: "Projet Voltaire (Woonoz)",
    lienOfficiel: "https://www.projet-voltaire.fr/certificat-voltaire/",
    public: "Francophones natifs et apprenants avancés (C1-C2) qui veulent attester leur maîtrise de l’orthographe et de la grammaire écrites.",
    niveaux: ["C1", "C2"],
    usages: ["Valorisation sur un CV ; certains recruteurs et écoles le demandent."],
    resultat: "Score sur 1000 : 300 = orthographe technique ; 500 = professionnelle ; 700 = affaires ; 900 = expert (seuils indicatifs).",
    validite: "4 ans (à vérifier).",
    epreuves: [
      { competence: "LS", nom: "Orthographe, grammaire, vocabulaire", duree: "Environ 3 h (dictée et questionnaire, selon la session)", format: "Phrases à analyser pour repérer une éventuelle faute, et questions de vocabulaire.", evalue: ["Accords (participe passé, adjectifs)", "Homophones grammaticaux", "Conjugaison", "Confusions lexicales et paronymes"] },
    ],
    exemple: {
      epreuve: "Repérage de faute",
      consigne: "Y a-t-il une faute ? « Les documents que je vous ai envoyé hier sont confidentiels. »",
      attendu: "Oui : « envoyés ». Avec l’auxiliaire avoir, le participe passé s’accorde avec le complément d’objet direct placé avant (« que », mis pour « les documents »).",
    },
    conseils: ["Révisez par familles de règles, pas au hasard.", "Lisez chaque phrase deux fois : une fois pour le sens, une fois pour les accords."],
    pieges: ["Voir des fautes partout : beaucoup de phrases sont correctes."],
  },
];

export const examen = (id: string) => EXAMENS.find((e) => e.id === id);
