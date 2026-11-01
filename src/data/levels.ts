import type { Competence, ExamId, Niveau } from "../lib/types";

export interface FichePedagogique {
  id: string;
  niveau: Niveau;
  titre: string;
  competence: Competence;
  objectif: string;
  /** Paragraphes d’explication. */
  explication: string[];
  /** Tableau facultatif : première ligne = en-têtes. */
  tableau?: string[][];
  exemples: string[];
  aRetenir: string[];
  piege: string;
  /** Activités de la banque qui entraînent ce point. */
  activites: string[];
}

export interface FicheNiveau {
  niveau: Niveau;
  nom: string;
  resume: string;
  /** Heures d’apprentissage guidé cumulées, ordre de grandeur souvent cité. */
  heures: string;
  savoirFaire: Record<"CO" | "CE" | "PE" | "PO", string[]>;
  themes: string[];
  grammaire: string[];
  lexique: string[];
  examens: { id: ExamId; label: string }[];
  fiches: FichePedagogique[];
}

export const NIVEAUX_CECRL: FicheNiveau[] = [
  {
    niveau: "A1",
    nom: "Découverte",
    resume: "Comprendre et utiliser des expressions familières et quotidiennes ; se présenter ; interagir simplement si l’interlocuteur parle lentement.",
    heures: "60 à 100 h",
    savoirFaire: {
      CO: ["Comprendre des consignes simples et des nombres", "Comprendre une annonce courte (gare, magasin)"],
      CE: ["Comprendre une affiche, un panneau, un message très court", "Repérer une date, une heure, un lieu"],
      PE: ["Remplir un formulaire", "Écrire une carte postale ou un message simple"],
      PO: ["Se présenter, parler de sa famille", "Demander et donner un prix, une heure, un chemin simple"],
    },
    themes: ["Identité et présentation", "Famille", "Nombres, dates, heures", "Courses et achats", "Ville et transports"],
    grammaire: ["Présent de être, avoir, s’appeler et des verbes en -er", "Articles définis et indéfinis", "Masculin et féminin, singulier et pluriel", "Négation ne… pas", "Questions simples (est-ce que, quel)"],
    lexique: ["Pays et nationalités", "Professions", "Jours, mois, couleurs", "Aliments courants"],
    examens: [{ id: "delf", label: "DELF A1" }, { id: "tcf", label: "TCF (score A1)" }, { id: "ccip", label: "DFP A1" }],
    fiches: [
      {
        id: "a1-se-presenter",
        niveau: "A1",
        titre: "Se présenter : être, avoir, s’appeler",
        competence: "PO",
        objectif: "Dire son nom, son âge, sa nationalité, sa profession et sa ville.",
        explication: [
          "Pour se présenter, trois verbes suffisent : s’appeler (le nom), avoir (l’âge) et être (la nationalité, la profession).",
          "En français, on dit « j’ai 25 ans » avec le verbe avoir, jamais « je suis 25 ans ».",
          "Devant une profession, on ne met pas d’article après être : « Je suis infirmière », et non « Je suis une infirmière ».",
        ],
        tableau: [
          ["", "être", "avoir", "s’appeler"],
          ["je / j’", "suis", "ai", "m’appelle"],
          ["tu", "es", "as", "t’appelles"],
          ["il / elle / on", "est", "a", "s’appelle"],
          ["nous", "sommes", "avons", "nous appelons"],
          ["vous", "êtes", "avez", "vous appelez"],
          ["ils / elles", "sont", "ont", "s’appellent"],
        ],
        exemples: ["Bonjour ! Je m’appelle Lucía. J’ai 28 ans. Je suis colombienne et j’habite à Medellín. Je suis architecte."],
        aRetenir: ["Âge : avoir + nombre + ans.", "Nationalité et profession : être + adjectif ou nom, sans article.", "Je → j’ devant une voyelle : j’ai, j’habite."],
        piege: "« Je suis 28 ans » est une traduction directe de certaines langues : en français, l’âge se dit avec avoir.",
        activites: ["a1-ls-etre-avoir", "a1-po-presentation"],
      },
      {
        id: "a1-articles",
        niveau: "A1",
        titre: "Les articles : un, une, des — le, la, les",
        competence: "LS",
        objectif: "Choisir entre article indéfini (une chose quelconque) et article défini (une chose précise ou générale).",
        explication: [
          "L’article indéfini (un, une, des) présente une chose nouvelle ou non précisée : « J’ai un chat. »",
          "L’article défini (le, la, l’, les) désigne une chose connue, unique ou un goût général : « Le chat de Marie est noir. » « J’aime le chocolat. »",
          "Après une négation, un, une, des deviennent de (ou d’) : « Je n’ai pas de voiture. »",
        ],
        tableau: [
          ["", "masculin", "féminin", "pluriel"],
          ["indéfini", "un", "une", "des"],
          ["défini", "le / l’", "la / l’", "les"],
        ],
        exemples: ["Il y a une boulangerie dans ma rue. La boulangerie ouvre à 7 heures.", "J’adore les films français, mais je n’ai pas de télévision."],
        aRetenir: ["Goûts (aimer, adorer, détester) → article défini.", "Négation → pas de / pas d’.", "Le, la → l’ devant une voyelle ou un h muet : l’hôtel, l’école."],
        piege: "« Je n’ai pas une voiture » est incorrect dans le sens général : on dit « je n’ai pas de voiture ».",
        activites: ["a1-ls-articles"],
      },
    ],
  },
  {
    niveau: "A2",
    nom: "Survie",
    resume: "Communiquer lors de tâches simples et habituelles ; décrire son environnement, son passé récent et ses besoins immédiats.",
    heures: "160 à 200 h",
    savoirFaire: {
      CO: ["Comprendre l’essentiel d’un message sur répondeur", "Suivre une conversation lente sur un sujet familier"],
      CE: ["Comprendre une lettre personnelle simple", "Trouver une information dans une annonce, un horaire, un menu"],
      PE: ["Écrire un message pour inviter, remercier, s’excuser", "Raconter un événement passé en quelques phrases"],
      PO: ["Décrire sa vie quotidienne", "Faire une réservation, un achat, une demande simple"],
    },
    themes: ["Vie quotidienne et loisirs", "Logement", "Voyages et vacances", "Santé simple", "Travail et études"],
    grammaire: ["Passé composé avec avoir et être", "Futur proche et passé récent", "Comparatif", "Pronoms COD le, la, les", "Adjectifs possessifs"],
    lexique: ["Logement et meubles", "Météo", "Corps et santé", "Moyens de transport"],
    examens: [{ id: "delf", label: "DELF A2" }, { id: "tcf", label: "TCF (score A2)" }, { id: "tef", label: "TEF (A2)" }, { id: "ccip", label: "DFP A2" }],
    fiches: [
      {
        id: "a2-passe-compose",
        niveau: "A2",
        titre: "Le passé composé : avoir ou être ?",
        competence: "LS",
        objectif: "Raconter une action terminée en choisissant le bon auxiliaire et le bon accord.",
        explication: [
          "Le passé composé = auxiliaire avoir ou être au présent + participe passé.",
          "La plupart des verbes se conjuguent avec avoir. Avec être : les verbes pronominaux (se lever, s’habiller) et une liste de verbes de mouvement ou de changement d’état : aller, venir, arriver, partir, entrer, sortir, monter, descendre, naître, mourir, rester, tomber, retourner, passer (et leurs composés : revenir, devenir, rentrer…).",
          "Avec être, le participe passé s’accorde avec le sujet : « Elles sont parties. »",
        ],
        tableau: [
          ["Infinitif", "Participe passé"],
          ["-er (parler)", "parlé"],
          ["finir, choisir", "fini, choisi"],
          ["prendre, mettre", "pris, mis"],
          ["voir, venir, lire", "vu, venu, lu"],
          ["faire, dire, écrire", "fait, dit, écrit"],
          ["être, avoir", "été, eu"],
        ],
        exemples: ["Samedi, j’ai visité le musée, puis je suis allée au cinéma avec Paul.", "Nous nous sommes levés tôt et nous avons pris le train."],
        aRetenir: ["Être + accord avec le sujet : elle est venue, ils sont arrivés.", "Avoir : pas d’accord avec le sujet.", "Négation : je n’ai pas vu, elle n’est pas venue."],
        piege: "« J’ai allé » : aller se conjugue avec être → « je suis allé(e) ».",
        activites: ["a2-ls-passe-compose", "a2-pe-message-vacances"],
      },
      {
        id: "a2-comparer",
        niveau: "A2",
        titre: "Comparer : plus, moins, aussi, autant",
        competence: "LS",
        objectif: "Comparer des personnes, des lieux ou des objets.",
        explication: [
          "Avec un adjectif ou un adverbe : plus / moins / aussi + adjectif + que. « Lyon est plus petite que Paris. »",
          "Avec un nom : plus de / moins de / autant de + nom + que. « Il y a moins de bruit à la campagne qu’en ville. »",
          "Avec un verbe : verbe + plus / moins / autant + que. « Je travaille autant que toi. »",
        ],
        exemples: ["Le train est plus rapide que le bus, mais il est aussi plus cher.", "Bon → meilleur : « Ce restaurant est meilleur que l’autre. »"],
        aRetenir: ["Bon → meilleur (et non « plus bon »).", "Bien → mieux : « Elle chante mieux que moi. »", "Aussi devant un adjectif, autant devant un nom ou après un verbe."],
        piege: "« Plus bon » est incorrect : on dit « meilleur ».",
        activites: ["a2-ls-comparatif"],
      },
    ],
  },
  {
    niveau: "B1",
    nom: "Seuil",
    resume: "Comprendre l’essentiel sur des sujets familiers ; se débrouiller en voyage ; raconter une expérience et justifier brièvement une opinion.",
    heures: "350 à 400 h",
    savoirFaire: {
      CO: ["Comprendre les points principaux d’une émission sur un sujet connu", "Suivre une conversation courante"],
      CE: ["Comprendre un article simple d’opinion", "Comprendre la description d’événements et de sentiments"],
      PE: ["Écrire un texte articulé sur un sujet familier", "Donner son opinion et la justifier"],
      PO: ["Raconter une expérience, un projet", "Défendre brièvement un point de vue"],
    },
    themes: ["Travail et télétravail", "Environnement au quotidien", "Médias et réseaux sociaux", "Études et projets", "Consommation"],
    grammaire: ["Imparfait et passé composé", "Plus-que-parfait (introduction)", "Pronoms relatifs qui, que, où, dont", "Pronoms y et en", "Futur simple et conditionnel présent", "Subjonctif après il faut que"],
    lexique: ["Sentiments et opinions", "Monde du travail", "Environnement", "Médias"],
    examens: [{ id: "delf", label: "DELF B1" }, { id: "tcf", label: "TCF (B1)" }, { id: "tcfq", label: "TCF Québec (B1)" }, { id: "tef", label: "TEF (B1)" }, { id: "ccip", label: "DFP B1" }],
    fiches: [
      {
        id: "b1-imparfait-pc",
        niveau: "B1",
        titre: "Imparfait ou passé composé ?",
        competence: "LS",
        objectif: "Raconter au passé en distinguant le décor (imparfait) et les événements (passé composé).",
        explication: [
          "L’imparfait décrit le cadre, les circonstances, les habitudes et les états : « Il faisait beau, les enfants jouaient. »",
          "Le passé composé présente les actions ponctuelles, terminées, qui font avancer l’histoire : « Soudain, l’orage a éclaté. »",
          "Une action en cours (imparfait) peut être interrompue par une action ponctuelle (passé composé) : « Je lisais quand le téléphone a sonné. »",
        ],
        tableau: [
          ["Imparfait", "Passé composé"],
          ["description, décor", "événement, action principale"],
          ["habitude : tous les jours, souvent", "action unique : un jour, soudain"],
          ["action en cours", "action qui interrompt"],
        ],
        exemples: ["Quand j’étais petite, j’allais chez ma grand-mère tous les étés. Un été, nous sommes partis en Bretagne."],
        aRetenir: ["Formation de l’imparfait : radical de nous au présent + -ais, -ais, -ait, -ions, -iez, -aient.", "Seule exception : être → j’étais.", "Les indicateurs (soudain, tous les jours…) aident mais ne remplacent pas le sens."],
        piege: "Mettre tout un récit au passé composé : le texte devient une liste d’actions sans décor.",
        activites: ["b1-ls-imparfait-pc", "b1-pe-souvenir"],
      },
      {
        id: "b1-argumenter",
        niveau: "B1",
        titre: "Donner son opinion et argumenter",
        competence: "PE",
        objectif: "Structurer un texte d’opinion de 160 mots et plus, comme au DELF B1.",
        explication: [
          "Un texte d’opinion suit un plan simple : introduction (le sujet et votre avis), deux ou trois arguments illustrés d’un exemple, conclusion.",
          "Les connecteurs rendent le raisonnement visible : d’abord, ensuite, de plus, enfin (ajouter) ; mais, cependant, par contre (opposer) ; donc, c’est pourquoi (conclure).",
          "Pour exprimer son opinion : je pense que, je trouve que, à mon avis, selon moi (+ indicatif) ; je ne pense pas que (+ subjonctif).",
        ],
        exemples: [
          "À mon avis, le télétravail présente plus d’avantages que d’inconvénients. D’abord, il évite de longs trajets. De plus, … Cependant, …",
        ],
        aRetenir: ["Un paragraphe = une idée.", "Chaque argument est suivi d’un exemple concret.", "La conclusion rappelle votre opinion ; elle n’introduit pas d’idée nouvelle."],
        piege: "Écrire une suite d’idées sans connecteurs ni paragraphes : le correcteur sanctionne la cohérence.",
        activites: ["b1-ce-teletravail", "b1-pe-forum"],
      },
    ],
  },
  {
    niveau: "B2",
    nom: "Avancé (utilisateur indépendant)",
    resume: "Comprendre l’essentiel de textes complexes ; communiquer avec aisance ; argumenter de façon claire et détaillée.",
    heures: "550 à 650 h",
    savoirFaire: {
      CO: ["Comprendre des conférences et des débats sur des sujets d’actualité", "Repérer le point de vue et l’attitude du locuteur"],
      CE: ["Comprendre des articles où l’auteur adopte une position", "Comprendre des textes littéraires contemporains en prose"],
      PE: ["Écrire un texte argumenté (lettre formelle, article, essai)", "Évaluer des idées et des solutions"],
      PO: ["Exposer un point de vue argumenté et le défendre", "Réagir aux objections et nuancer"],
    },
    themes: ["Transition écologique", "Intelligence artificielle et emploi", "Éducation", "Santé publique", "Médias et désinformation"],
    grammaire: ["Subjonctif (opinion, sentiment, but, concession)", "Concession et opposition", "Cause et conséquence", "Conditionnel passé, hypothèses", "Discours rapporté au passé", "Voix passive"],
    lexique: ["Argumentation", "Société et institutions", "Sciences et technologies", "Nuances d’opinion"],
    examens: [{ id: "delf", label: "DELF B2" }, { id: "tcf", label: "TCF (B2)" }, { id: "tcfq", label: "TCF Québec (B2)" }, { id: "tef", label: "TEF (B2)" }, { id: "ccip", label: "DFP B2" }],
    fiches: [
      {
        id: "b2-subjonctif",
        niveau: "B2",
        titre: "Le subjonctif : quand l’employer ?",
        competence: "LS",
        objectif: "Employer le subjonctif après les expressions qui l’exigent et l’éviter ailleurs.",
        explication: [
          "Le subjonctif s’emploie dans une proposition introduite par que quand la principale exprime une volonté, une obligation, un sentiment, un doute ou un jugement : « Je souhaite que tu viennes. » « Il est essentiel que chacun puisse s’exprimer. »",
          "Il suit aussi certaines conjonctions : pour que, afin que, bien que, quoique, avant que, à condition que, sans que.",
          "Penser, croire, trouver à la forme affirmative sont suivis de l’indicatif ; à la forme négative ou interrogative avec inversion, ils peuvent être suivis du subjonctif : « Je ne pense pas qu’il ait raison. »",
        ],
        tableau: [
          ["Subjonctif", "Indicatif"],
          ["il faut que, je veux que", "je pense que, je crois que"],
          ["bien que, pour que, avant que", "parce que, alors que, après que"],
          ["je doute que, il est possible que", "il est probable que, je suis sûr que"],
        ],
        exemples: ["Bien que la mesure soit impopulaire, elle reste nécessaire.", "Il est probable que la loi sera votée (indicatif)."],
        aRetenir: ["Après que → indicatif (malgré l’usage oral fréquent du subjonctif).", "Si les deux sujets sont identiques, on préfère l’infinitif : « Je veux partir » (et non « je veux que je parte »).", "Formes irrégulières : être (que je sois), avoir (que j’aie), faire (que je fasse), aller (que j’aille), pouvoir (que je puisse), savoir (que je sache), vouloir (que je veuille)."],
        piege: "« Il est probable que » appelle l’indicatif, mais « il est possible que » appelle le subjonctif.",
        activites: ["b2-ls-subjonctif"],
      },
      {
        id: "b2-concession",
        niveau: "B2",
        titre: "Concéder et réfuter : nuancer son argumentation",
        competence: "PE",
        objectif: "Reconnaître un argument adverse avant de le réfuter, comme l’attendent les grilles du DELF B2.",
        explication: [
          "Concéder, c’est admettre une partie de l’argument opposé ; réfuter, c’est montrer qu’il ne suffit pas. Ce mouvement montre un raisonnement nuancé.",
          "Structures utiles : certes… mais ; il est vrai que… cependant ; même si (+ indicatif)… ; bien que (+ subjonctif)… ; malgré (+ nom)… ; avoir beau (+ infinitif)…",
          "Pour opposer deux faits : alors que, tandis que (+ indicatif), en revanche, au contraire.",
        ],
        exemples: [
          "Certes, les voitures électriques n’émettent pas de gaz d’échappement ; leur fabrication reste toutefois très gourmande en ressources.",
          "On a beau multiplier les campagnes de sensibilisation, les comportements changent lentement.",
        ],
        aRetenir: ["Même si + indicatif ; bien que + subjonctif ; malgré + nom.", "Un bon texte B2 contient au moins une concession explicite.", "Pourtant et toutefois introduisent un fait inattendu."],
        piege: "« Malgré que » est critiqué dans l’écrit soigné : préférez « bien que » ou « malgré + nom ».",
        activites: ["b2-ce-ia-emploi", "b2-pe-lettre-maire"],
      },
    ],
  },
  {
    niveau: "C1",
    nom: "Autonome",
    resume: "Comprendre des textes longs et exigeants, saisir les implicites ; s’exprimer de façon fluide, structurée et adaptée au contexte.",
    heures: "800 à 1 000 h",
    savoirFaire: {
      CO: ["Comprendre un discours long même peu structuré", "Saisir les implicites et les changements de registre"],
      CE: ["Comprendre des textes spécialisés ou littéraires longs", "Analyser la stratégie argumentative d’un auteur"],
      PE: ["Rédiger une synthèse de documents", "Écrire un essai argumenté nuancé"],
      PO: ["Faire un exposé problématisé", "Débattre en reformulant et en nuançant"],
    },
    themes: ["Débats de société", "Économie et travail", "Sciences et éthique", "Culture et patrimoine", "Mondialisation"],
    grammaire: ["Nominalisation", "Participe présent, gérondif, adjectif verbal", "Expression de l’hypothèse (pour peu que, à supposer que)", "Mise en relief (c’est… qui, ce qui… c’est)", "Accord du participe passé (cas complexes)"],
    lexique: ["Connecteurs du discours soutenu", "Verbes introducteurs (souligner, nuancer, réfuter)", "Lexique abstrait"],
    examens: [{ id: "dalf", label: "DALF C1" }, { id: "tcf", label: "TCF (C1)" }, { id: "tef", label: "TEF (C1)" }, { id: "ccip", label: "DFP C1" }, { id: "voltaire", label: "Certificat Voltaire" }],
    fiches: [
      {
        id: "c1-synthese",
        niveau: "C1",
        titre: "La synthèse de documents (DALF C1)",
        competence: "PE",
        objectif: "Rédiger une synthèse objective d’environ 220 mots à partir de deux ou trois documents.",
        explication: [
          "La synthèse confronte les documents autour d’une problématique commune. Elle ne résume pas les textes l’un après l’autre : elle organise leurs idées en un plan thématique.",
          "Méthode : 1) repérer le thème commun ; 2) relever les idées de chaque document dans un tableau ; 3) formuler une problématique ; 4) construire un plan en deux ou trois parties ; 5) rédiger avec vos propres mots, sans opinion personnelle.",
          "Le titre est attendu. L’introduction présente le thème et la problématique ; la conclusion répond brièvement à la problématique.",
        ],
        exemples: ["Si le premier document souligne les bénéfices du télétravail pour la qualité de vie, le second en nuance la portée en évoquant l’isolement des salariés."],
        aRetenir: ["Aucune opinion personnelle, aucun « je ».", "Pas de citation longue : on reformule.", "Respecter le nombre de mots (environ 220, avec une tolérance)."],
        piege: "Juxtaposer « Le document 1 dit… Le document 2 dit… » : c’est un résumé, pas une synthèse.",
        activites: ["c1-ce-attention", "c1-pe-synthese"],
      },
      {
        id: "c1-nominalisation",
        niveau: "C1",
        titre: "La nominalisation",
        competence: "LS",
        objectif: "Transformer un verbe ou un adjectif en nom pour densifier un texte (titres, synthèses, plans).",
        explication: [
          "Nominaliser, c’est remplacer une proposition par un groupe nominal : « Les prix augmentent » → « l’augmentation des prix ».",
          "Suffixes fréquents : -tion/-sion (réduire → réduction), -ment (développer → développement), -age (nettoyer → nettoyage), -ure (ouvrir → ouverture), -ité (rare → rareté), -ance/-ence (exiger → exigence).",
          "Certains noms ont une forme sans suffixe : refuser → refus, choisir → choix, débattre → débat.",
        ],
        exemples: ["« Le gouvernement a décidé de fermer l’usine » → « La décision gouvernementale de fermeture de l’usine »."],
        aRetenir: ["Utile pour les titres de synthèse et les plans d’exposé.", "Attention au genre : la réduction, le développement.", "Ne pas abuser : une phrase trop nominale devient lourde."],
        piege: "Inventer un nom : « la résolvation » n’existe pas → « la résolution ».",
        activites: ["c1-ls-nominalisation"],
      },
    ],
  },
  {
    niveau: "C2",
    nom: "Maîtrise",
    resume: "Comprendre sans effort pratiquement tout ; restituer faits et arguments de sources diverses ; s’exprimer avec précision et finesse.",
    heures: "1 000 à 1 200 h et plus",
    savoirFaire: {
      CO: ["Comprendre tout discours, même rapide et idiomatique"],
      CE: ["Comprendre des textes abstraits, complexes, très idiomatiques"],
      PE: ["Rédiger un texte structuré à partir d’un dossier (article, éditorial, rapport)", "Adapter finement le registre"],
      PO: ["Présenter un point de vue construit à partir de documents oraux et débattre avec un jury"],
    },
    themes: ["Philosophie et société", "Littérature et arts", "Politique internationale", "Épistémologie et sciences"],
    grammaire: ["Concordance des temps soutenue (subjonctif imparfait en lecture)", "Modalisation", "Ellipse et style", "Accords complexes (participes des verbes pronominaux)"],
    lexique: ["Registres et connotations", "Expressions idiomatiques", "Lexique spécialisé"],
    examens: [{ id: "dalf", label: "DALF C2" }, { id: "tcf", label: "TCF (C2)" }, { id: "tef", label: "TEF (C2)" }, { id: "voltaire", label: "Certificat Voltaire (score expert)" }],
    fiches: [
      {
        id: "c2-modalisation",
        niveau: "C2",
        titre: "Modaliser : nuancer le degré de certitude",
        competence: "PE",
        objectif: "Exprimer avec précision le degré de certitude, de distance ou d’engagement.",
        explication: [
          "La modalisation indique la position du locuteur par rapport à ce qu’il dit. Elle passe par les verbes (sembler, paraître, prétendre), les adverbes (sans doute, vraisemblablement, indéniablement), le conditionnel journalistique (« le ministre aurait démissionné ») et le lexique évaluatif.",
          "Attention : « sans doute » signifie aujourd’hui « probablement » ; pour une certitude, on dit « sans aucun doute ».",
          "Prendre ses distances avec une source : selon X, d’après X, X affirme que… (neutre), X prétend que… (distance critique).",
        ],
        exemples: ["Cette réforme, présentée comme indispensable, semble pourtant n’avoir convaincu qu’une minorité d’experts."],
        aRetenir: ["Le conditionnel signale une information non confirmée.", "« Prétendre » marque le doute du locuteur.", "Variez les modalisateurs : la répétition de « peut-être » appauvrit le style."],
        piege: "Confondre « sans doute » (probablement) et « sans aucun doute » (certainement).",
        activites: ["c2-ce-editorial", "c2-pe-editorial"],
      },
      {
        id: "c2-participes-pronominaux",
        niveau: "C2",
        titre: "Accord du participe passé des verbes pronominaux",
        competence: "LS",
        objectif: "Maîtriser un point d’orthographe grammaticale souvent évalué (Certificat Voltaire, DALF).",
        explication: [
          "Pour la plupart des verbes pronominaux, on accorde comme avec avoir : le participe s’accorde avec le complément d’objet direct s’il est placé avant. « Elle s’est lavée » (elle a lavé qui ? se = elle) mais « Elle s’est lavé les mains » (COD les mains, placé après).",
          "Si le pronom est complément indirect, pas d’accord : « Ils se sont parlé » (parler à quelqu’un), « Elles se sont souri », « Ils se sont succédé ».",
          "Les verbes essentiellement pronominaux (s’évanouir, se souvenir, s’absenter…) s’accordent avec le sujet : « Elles se sont souvenues de cette date. »",
        ],
        exemples: ["Les lettres qu’ils se sont écrites (COD « que » placé avant).", "Ils se sont écrit de longues lettres (COD placé après : pas d’accord)."],
        aRetenir: ["Se demander : le pronom « se » est-il COD ou COI ?", "Se parler, se sourire, se plaire, se succéder, se nuire, se ressembler : invariables.", "Se rendre compte : invariable (« compte » est le COD)."],
        piege: "« Elles se sont rendues compte » : faute fréquente → « elles se sont rendu compte ».",
        activites: ["c2-ls-voltaire"],
      },
    ],
  },
];

export const niveau = (n: string) => NIVEAUX_CECRL.find((x) => x.niveau === n);
export const toutesFiches = () => NIVEAUX_CECRL.flatMap((n) => n.fiches);
