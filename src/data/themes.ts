import type { ExamId, Niveau } from "../lib/types";
import type { Activite } from "./activities";

/**
 * Révisions thématiques : pour chaque niveau, des fiches de lexique avec expressions,
 * texte modèle et pistes pour l’oral. Chaque fiche produit automatiquement un quiz
 * (voir `activitesLexique`) qui compte dans les progrès comme les autres activités.
 */
export interface EntreeLexique {
  mot: string;
  /** Définition ou indice, sans le mot lui-même (sert de question dans le quiz et les cartes). */
  indice: string;
  exemple: string;
}

export interface FicheThematique {
  id: string;
  niveau: Niveau;
  theme: string;
  resume: string;
  lexique: EntreeLexique[];
  expressions: string[];
  /** Court texte modèle qui réemploie le lexique. */
  modele: string;
  /** Questions pour s’entraîner à l’oral. */
  aLoral: string[];
  examens: ExamId[];
}

const DELF_TCF: ExamId[] = ["delf", "tcf"];
const DELF_TCF_TEF: ExamId[] = ["delf", "tcf", "tcfq", "tef"];
const DALF_TCF: ExamId[] = ["dalf", "tcf", "tef"];

export const THEMES: FicheThematique[] = [
  // ─────────────────────────── A1 ───────────────────────────
  {
    id: "a1-famille",
    niveau: "A1",
    theme: "La famille et les proches",
    resume: "Présenter les personnes de sa famille et son entourage.",
    lexique: [
      { mot: "le père", indice: "C’est le papa.", exemple: "Mon père s’appelle Jorge." },
      { mot: "la mère", indice: "C’est la maman.", exemple: "Ma mère travaille dans une école." },
      { mot: "le frère", indice: "C’est un garçon. Il a les mêmes parents que moi.", exemple: "J’ai un frère : il a douze ans." },
      { mot: "la sœur", indice: "C’est une fille. Elle a les mêmes parents que moi.", exemple: "Ma sœur habite à Madrid." },
      { mot: "les grands-parents", indice: "Ce sont les parents de mes parents.", exemple: "Le dimanche, je déjeune chez mes grands-parents." },
      { mot: "le mari", indice: "C’est l’époux, dans un couple.", exemple: "Le mari de Clara est médecin." },
      { mot: "l’enfant", indice: "C’est le fils ou la fille d’une personne.", exemple: "Ils ont un enfant : une petite fille." },
      { mot: "le voisin", indice: "Il habite à côté de chez moi.", exemple: "Mon voisin est très sympathique." },
    ],
    expressions: ["J’ai un frère et deux sœurs.", "Je suis fils unique. / Je suis fille unique.", "Mes parents habitent à…", "Il est marié. / Elle est célibataire.", "Voici ma famille."],
    modele: "Je m’appelle Diego. Dans ma famille, nous sommes cinq : mon père, ma mère, mon frère, ma sœur et moi. Mon frère a quinze ans et ma sœur a huit ans. Mes grands-parents habitent à côté : ce sont nos voisins !",
    aLoral: ["Vous avez des frères et sœurs ?", "Où habitent vos parents ?", "Présentez une personne de votre famille."],
    examens: DELF_TCF,
  },
  {
    id: "a1-courses",
    niveau: "A1",
    theme: "Les courses et les repas",
    resume: "Acheter, demander un prix, commander et payer.",
    lexique: [
      { mot: "la boulangerie", indice: "Dans ce magasin, on achète le pain.", exemple: "Je vais à la boulangerie tous les matins." },
      { mot: "le marché", indice: "On y achète des fruits et des légumes frais, souvent dehors, sur une place.", exemple: "Le marché est ouvert le samedi matin." },
      { mot: "le prix", indice: "C’est la somme d’argent à payer.", exemple: "Quel est le prix de ce fromage ?" },
      { mot: "le petit déjeuner", indice: "C’est le repas du matin.", exemple: "Au petit déjeuner, je prends un café et une tartine." },
      { mot: "l’addition", indice: "Au restaurant, on la demande à la fin du repas pour payer.", exemple: "L’addition, s’il vous plaît !" },
      { mot: "les légumes", indice: "Par exemple : les carottes, les haricots verts, les courgettes.", exemple: "Je mange des légumes à chaque repas." },
      { mot: "la bouteille", indice: "L’eau et le jus de fruits sont vendus dans cet objet.", exemple: "Une bouteille d’eau, s’il vous plaît." },
      { mot: "la monnaie", indice: "Ce sont les pièces que le vendeur rend quand on paie.", exemple: "Voilà votre monnaie : deux euros." },
    ],
    expressions: ["Je voudrais une baguette, s’il vous plaît.", "C’est combien ?", "Ça fait quatre euros cinquante.", "Vous avez de la monnaie ?", "L’addition, s’il vous plaît."],
    modele: "Le samedi, je fais les courses. D’abord, je vais au marché : j’achète des légumes et des fruits. Ensuite, je passe à la boulangerie. Le pain coûte un euro vingt. À midi, je déjeune au restaurant avec une amie et nous partageons l’addition.",
    aLoral: ["Où est-ce que vous faites vos courses ?", "Qu’est-ce que vous prenez au petit déjeuner ?", "Jouez la scène : vous achetez du pain et un gâteau."],
    examens: DELF_TCF,
  },
  {
    id: "a1-ville",
    niveau: "A1",
    theme: "La ville et les transports",
    resume: "Se repérer, demander son chemin, prendre le train ou le bus.",
    lexique: [
      { mot: "la gare", indice: "On y prend le train.", exemple: "La gare est à dix minutes à pied." },
      { mot: "le billet", indice: "Il faut l’acheter pour voyager en train ou en avion.", exemple: "Un billet pour Lyon, s’il vous plaît." },
      { mot: "l’arrêt de bus", indice: "On y attend le bus.", exemple: "L’arrêt de bus est devant la pharmacie." },
      { mot: "la pharmacie", indice: "On y achète des médicaments.", exemple: "Il y a une pharmacie près d’ici ?" },
      { mot: "la rue", indice: "Elle a un nom et des numéros : on l’écrit dans l’adresse.", exemple: "J’habite 12 rue des Lilas." },
      { mot: "le plan", indice: "C’est le dessin de la ville, avec les rues et les stations.", exemple: "Vous avez un plan du métro ?" },
      { mot: "la poste", indice: "On y envoie des lettres et des colis.", exemple: "La poste ferme à 18 heures." },
      { mot: "le pont", indice: "Il permet de traverser la rivière.", exemple: "Traversez le pont, puis tournez à gauche." },
    ],
    expressions: ["Pardon, où est la gare, s’il vous plaît ?", "C’est loin ? — Non, c’est à cinq minutes à pied.", "Prenez la première rue à droite.", "Continuez tout droit.", "Je cherche un arrêt de bus."],
    modele: "Pour aller à la gare, c’est facile. Vous sortez de l’hôtel et vous prenez la rue Victor-Hugo. Vous traversez le pont. La poste est à gauche et la pharmacie est à droite. La gare est en face, à côté de l’arrêt de bus.",
    aLoral: ["Comment venez-vous au cours de français ?", "Qu’est-ce qu’il y a dans votre rue ?", "Expliquez le chemin de chez vous à la gare."],
    examens: DELF_TCF,
  },

  // ─────────────────────────── A2 ───────────────────────────
  {
    id: "a2-logement",
    niveau: "A2",
    theme: "Le logement",
    resume: "Décrire un logement, comprendre une annonce, parler de son quartier.",
    lexique: [
      { mot: "le loyer", indice: "C’est l’argent que l’on paie chaque mois pour habiter un logement.", exemple: "Le loyer est de 600 euros par mois." },
      { mot: "le locataire", indice: "Cette personne paie pour habiter dans un logement qui n’est pas à elle.", exemple: "Le locataire du troisième étage a déménagé." },
      { mot: "le propriétaire", indice: "Le logement est à cette personne.", exemple: "Le propriétaire a réparé le chauffage." },
      { mot: "les charges", indice: "On les paie en plus : l’eau, l’électricité, l’entretien de l’immeuble.", exemple: "Les charges sont comprises dans le prix." },
      { mot: "le déménagement", indice: "C’est le moment où l’on change de logement avec tous ses meubles.", exemple: "Des amis m’aident pour le déménagement." },
      { mot: "l’ascenseur", indice: "Il monte et descend dans l’immeuble : pas besoin de prendre l’escalier.", exemple: "L’ascenseur est en panne." },
      { mot: "la colocation", indice: "Plusieurs personnes partagent le même appartement.", exemple: "Je vis en colocation avec deux étudiantes." },
      { mot: "le quartier", indice: "C’est la partie de la ville où l’on habite.", exemple: "Mon quartier est calme, avec beaucoup de commerces." },
    ],
    expressions: ["Je cherche un appartement de deux pièces.", "Le loyer est de combien, charges comprises ?", "L’appartement est au troisième étage, sans ascenseur.", "Est-ce que je peux visiter samedi ?", "C’est un quartier calme, près des commerces."],
    modele: "Je viens de déménager. Mon nouvel appartement est petit, mais lumineux. Il est au quatrième étage et, heureusement, il y a un ascenseur ! Le loyer est de 550 euros, charges comprises. Le propriétaire est sympathique et le quartier est très vivant. Avant, je vivais en colocation ; maintenant, j’habite seule.",
    aLoral: ["Décrivez votre logement.", "Préférez-vous vivre seul ou en colocation ? Pourquoi ?", "Racontez votre dernier déménagement."],
    examens: DELF_TCF_TEF,
  },
  {
    id: "a2-sante",
    niveau: "A2",
    theme: "La santé",
    resume: "Dire où l’on a mal, prendre rendez-vous, comprendre des conseils simples.",
    lexique: [
      { mot: "l’ordonnance", indice: "Le médecin écrit sur ce papier les médicaments à prendre.", exemple: "Je vais à la pharmacie avec mon ordonnance." },
      { mot: "la fièvre", indice: "La température du corps monte : 39 degrés, par exemple.", exemple: "Il a de la fièvre : il reste au lit." },
      { mot: "le rendez-vous", indice: "On le prend pour voir le médecin à une heure précise.", exemple: "J’ai rendez-vous chez le dentiste à 15 heures." },
      { mot: "le rhume", indice: "Petite maladie de l’hiver : le nez coule et on éternue.", exemple: "J’ai attrapé un rhume." },
      { mot: "les urgences", indice: "C’est le service de l’hôpital où l’on va tout de suite quand c’est grave.", exemple: "Elle s’est cassé le bras : nous allons aux urgences." },
      { mot: "le médicament", indice: "On le prend pour se soigner : un comprimé ou un sirop, par exemple.", exemple: "Prenez ce médicament matin et soir." },
      { mot: "tousser", indice: "Faire un bruit fort avec la gorge, plusieurs fois, quand on est malade.", exemple: "Il tousse beaucoup la nuit." },
      { mot: "se reposer", indice: "Rester tranquille pour reprendre des forces.", exemple: "Le médecin m’a dit de me reposer trois jours." },
    ],
    expressions: ["J’ai mal à la tête / à la gorge / au ventre.", "Je voudrais prendre rendez-vous avec le docteur Martin.", "Depuis quand êtes-vous malade ?", "Je tousse et j’ai de la fièvre.", "Vous devez vous reposer."],
    modele: "Hier, je ne me sentais pas bien : j’avais de la fièvre et je toussais beaucoup. J’ai pris rendez-vous chez le médecin. Il m’a dit : « Ce n’est pas grave, c’est un gros rhume. » Il m’a donné une ordonnance. Je suis allé à la pharmacie pour acheter les médicaments, puis je suis rentré me reposer.",
    aLoral: ["Que faites-vous quand vous êtes malade ?", "Jouez la scène : vous téléphonez pour prendre rendez-vous chez le médecin.", "Que faites-vous pour rester en forme ?"],
    examens: DELF_TCF_TEF,
  },
  {
    id: "a2-voyages",
    niveau: "A2",
    theme: "Les voyages et les vacances",
    resume: "Réserver, se déplacer, raconter un séjour.",
    lexique: [
      { mot: "la valise", indice: "On y met ses vêtements pour partir.", exemple: "Ma valise pèse vingt kilos." },
      { mot: "l’aller-retour", indice: "C’est un billet pour partir et pour revenir.", exemple: "Un aller-retour Paris-Nice coûte 90 euros." },
      { mot: "la réservation", indice: "On la fait avant le voyage pour être sûr d’avoir une chambre ou une place.", exemple: "J’ai une réservation au nom de Garcia." },
      { mot: "le séjour", indice: "C’est le temps que l’on passe dans un lieu pendant un voyage.", exemple: "Notre séjour à Lisbonne a duré une semaine." },
      { mot: "le paysage", indice: "C’est ce que l’on voit dans la nature : la mer, la montagne, la campagne.", exemple: "Le paysage est magnifique." },
      { mot: "le retard", indice: "Le train n’arrive pas à l’heure prévue : il arrive plus tard.", exemple: "L’avion a deux heures de retard." },
      { mot: "le passeport", indice: "Ce document d’identité est nécessaire pour entrer dans beaucoup de pays.", exemple: "N’oublie pas ton passeport !" },
      { mot: "le souvenir", indice: "C’est un petit objet que l’on achète en voyage pour sa famille ou ses amis.", exemple: "J’ai acheté des souvenirs au marché." },
    ],
    expressions: ["Je voudrais réserver une chambre pour deux nuits.", "À quelle heure part le train pour Bordeaux ?", "Un aller-retour, s’il vous plaît.", "Nous avons passé un excellent séjour.", "Le vol a été annulé."],
    modele: "L’été dernier, je suis partie une semaine au Portugal avec mon frère. Nous avons fait une réservation dans un petit hôtel près de la plage. Le premier jour, l’avion avait une heure de retard et ma valise est arrivée le lendemain ! Mais le séjour était merveilleux : les paysages étaient magnifiques et j’ai rapporté beaucoup de souvenirs.",
    aLoral: ["Racontez vos dernières vacances.", "Préférez-vous la mer ou la montagne ? Pourquoi ?", "Jouez la scène : vous réservez une chambre d’hôtel par téléphone."],
    examens: DELF_TCF_TEF,
  },

  // ─────────────────────────── B1 ───────────────────────────
  {
    id: "b1-travail",
    niveau: "B1",
    theme: "Le travail",
    resume: "Parler de son parcours, de son emploi et de ses projets professionnels.",
    lexique: [
      { mot: "l’entretien d’embauche", indice: "Rencontre entre un candidat et un employeur avant un recrutement.", exemple: "J’ai un entretien d’embauche lundi matin." },
      { mot: "le stage", indice: "Période de formation pratique dans une entreprise, souvent pendant les études.", exemple: "Elle fait un stage de trois mois dans une banque." },
      { mot: "le salaire", indice: "Somme d’argent que l’on reçoit chaque mois pour son travail.", exemple: "Il a demandé une augmentation de salaire." },
      { mot: "démissionner", indice: "Quitter son emploi par sa propre décision.", exemple: "Elle a démissionné pour créer son entreprise." },
      { mot: "le chômage", indice: "Situation d’une personne qui cherche un emploi et n’en trouve pas.", exemple: "Après la fermeture de l’usine, il est resté six mois au chômage." },
      { mot: "le télétravail", indice: "Façon de travailler depuis chez soi grâce à Internet.", exemple: "Je suis en télétravail deux jours par semaine." },
      { mot: "le contrat", indice: "Document signé par le salarié et l’employeur, qui fixe les conditions de l’emploi.", exemple: "J’ai signé un contrat d’un an." },
      { mot: "les horaires", indice: "Heures auxquelles on commence et on finit sa journée.", exemple: "Mes horaires sont souples." },
    ],
    expressions: ["Je travaille à temps plein / à temps partiel.", "J’ai postulé à une offre d’emploi.", "Je m’entends bien avec mes collègues.", "J’aimerais évoluer dans mon métier.", "Je suis à la recherche d’un emploi."],
    modele: "Après mes études, j’ai fait un stage de six mois dans une agence de communication. Ensuite, j’ai passé plusieurs entretiens d’embauche avant de signer mon premier contrat. Le salaire n’était pas très élevé, mais les horaires étaient souples et je pouvais faire du télétravail. Au bout de deux ans, j’ai démissionné pour reprendre des études.",
    aLoral: ["Quel métier faites-vous ou aimeriez-vous faire ? Pourquoi ?", "Quels sont les avantages et les inconvénients du télétravail ?", "Racontez un entretien d’embauche ou une première journée de travail."],
    examens: DELF_TCF_TEF,
  },
  {
    id: "b1-environnement",
    niveau: "B1",
    theme: "L’environnement au quotidien",
    resume: "Décrire des gestes écologiques et donner son avis sur une mesure.",
    lexique: [
      { mot: "trier", indice: "Séparer les déchets (verre, papier, plastique) pour les mettre dans des poubelles différentes.", exemple: "Dans mon immeuble, tout le monde trie ses déchets." },
      { mot: "le recyclage", indice: "Transformation des déchets pour fabriquer de nouveaux objets.", exemple: "Le recyclage du verre économise de l’énergie." },
      { mot: "gaspiller", indice: "Utiliser plus que nécessaire, ou jeter ce qui pourrait encore servir.", exemple: "Il ne faut pas gaspiller l’eau." },
      { mot: "le réchauffement climatique", indice: "Hausse de la température moyenne de la planète.", exemple: "Le réchauffement climatique fait fondre les glaciers." },
      { mot: "les énergies renouvelables", indice: "Le soleil, le vent et l’eau en sont des sources : elles ne s’épuisent pas.", exemple: "Ce pays investit dans les énergies renouvelables." },
      { mot: "les transports en commun", indice: "Le bus, le métro et le tramway en font partie.", exemple: "Je prends les transports en commun pour aller travailler." },
      { mot: "la pollution", indice: "Dégradation de l’air, de l’eau ou du sol par des substances dangereuses.", exemple: "La pollution de l’air augmente en hiver." },
      { mot: "le covoiturage", indice: "Plusieurs personnes partagent une voiture pour faire le même trajet.", exemple: "Grâce au covoiturage, je paie mes trajets moins cher." },
    ],
    expressions: ["Il faut réduire nos déchets.", "Je fais attention à ma consommation d’eau.", "Chacun peut agir à son niveau.", "Ça ne sert à rien de…, si…", "Je suis pour / contre l’interdiction des voitures en ville."],
    modele: "Dans ma ville, les habitants font de plus en plus d’efforts pour protéger l’environnement. Nous trions nos déchets et la mairie encourage le recyclage. Beaucoup de gens prennent les transports en commun ou pratiquent le covoiturage pour limiter la pollution. Pourtant, on gaspille encore trop : il faudrait développer les énergies renouvelables et consommer moins.",
    aLoral: ["Que faites-vous au quotidien pour protéger l’environnement ?", "Faut-il interdire les voitures dans le centre des villes ?", "Quel est, selon vous, le principal problème écologique de votre pays ?"],
    examens: DELF_TCF_TEF,
  },
  {
    id: "b1-medias",
    niveau: "B1",
    theme: "Les médias et les réseaux sociaux",
    resume: "Dire comment on s’informe et discuter de l’usage des écrans.",
    lexique: [
      { mot: "une émission", indice: "Programme de radio ou de télévision.", exemple: "J’écoute cette émission tous les matins." },
      { mot: "s’abonner", indice: "S’inscrire pour recevoir régulièrement un journal ou pour suivre un compte.", exemple: "Je me suis abonné à un journal en ligne." },
      { mot: "publier", indice: "Mettre un texte, une photo ou une vidéo en ligne pour que les autres les voient.", exemple: "Elle publie une photo par jour." },
      { mot: "une fausse information", indice: "Nouvelle inventée ou déformée, présentée comme vraie.", exemple: "Cette fausse information a été partagée des milliers de fois." },
      { mot: "la vie privée", indice: "Tout ce qui concerne une personne et qu’elle ne souhaite pas rendre public.", exemple: "Les réseaux sociaux menacent parfois la vie privée." },
      { mot: "un écran", indice: "Surface sur laquelle s’affichent les images d’un téléphone, d’un ordinateur ou d’une télévision.", exemple: "Les enfants passent trop de temps devant les écrans." },
      { mot: "un titre", indice: "Quelques mots en gros caractères placés au-dessus d’un article.", exemple: "Le titre de l’article attire l’attention." },
      { mot: "se renseigner", indice: "Chercher des informations sur un sujet.", exemple: "Avant de voter, je me renseigne sur les programmes." },
    ],
    expressions: ["Je m’informe surtout sur Internet.", "J’ai lu dans un article que…", "D’après ce reportage, …", "Il ne faut pas croire tout ce qu’on lit.", "Je passe trop de temps sur mon téléphone."],
    modele: "Chaque matin, je regarde les titres de l’actualité sur mon téléphone. Je me suis abonnée à deux journaux et j’écoute une émission de radio dans le bus. Sur les réseaux sociaux, je publie rarement : je préfère protéger ma vie privée. Et quand une information me paraît étrange, je me renseigne ailleurs, car les fausses informations circulent très vite.",
    aLoral: ["Comment vous informez-vous ?", "Les réseaux sociaux sont-ils dangereux pour les adolescents ?", "Avez-vous déjà cru à une fausse information ? Racontez."],
    examens: DELF_TCF_TEF,
  },

  // ─────────────────────────── B2 ───────────────────────────
  {
    id: "b2-argumenter",
    niveau: "B2",
    theme: "Le lexique du débat",
    resume: "Les mots pour analyser une question, nuancer et prendre position.",
    lexique: [
      { mot: "un enjeu", indice: "Ce que l’on peut gagner ou perdre dans une situation ; ce qui compte vraiment dans un débat.", exemple: "L’enjeu de cette réforme est l’égalité des chances." },
      { mot: "nuancer", indice: "Exprimer une idée de façon moins tranchée, en tenant compte des cas particuliers.", exemple: "Il faut nuancer cette affirmation : tout dépend du contexte." },
      { mot: "remettre en cause", indice: "Contester la valeur ou la légitimité de quelque chose.", exemple: "Cette étude remet en cause une idée répandue." },
      { mot: "une idée reçue", indice: "Opinion répandue, acceptée sans réflexion et souvent fausse.", exemple: "Contrairement à une idée reçue, les jeunes lisent encore." },
      { mot: "une polémique", indice: "Débat public vif, qui oppose fortement les opinions.", exemple: "Le projet de loi a suscité une vive polémique." },
      { mot: "souligner", indice: "Insister sur un point pour montrer son importance.", exemple: "L’auteur souligne les limites de cette mesure." },
      { mot: "un constat", indice: "Observation d’une réalité, sur laquelle on s’appuie pour raisonner.", exemple: "Le constat est sans appel : les inégalités augmentent." },
      { mot: "prôner", indice: "Recommander vivement, défendre publiquement une idée ou une pratique.", exemple: "Cette association prône la sobriété énergétique." },
    ],
    expressions: ["Il convient de s’interroger sur…", "Cet argument ne résiste pas à l’examen.", "On ne saurait nier que…", "Il n’en demeure pas moins que…", "Tout porte à croire que…"],
    modele: "La semaine de quatre jours suscite une vive polémique. Ses partisans prônent un meilleur équilibre de vie et soulignent que la productivité ne baisse pas. Ce constat mérite toutefois d’être nuancé : les études portent sur des entreprises volontaires, ce qui remet en cause leur portée générale. L’enjeu dépasse donc l’organisation du travail : c’est notre rapport au temps qui est interrogé, loin des idées reçues.",
    aLoral: ["Citez une idée reçue sur votre pays et nuancez-la.", "Quel est, selon vous, le principal enjeu de l’éducation aujourd’hui ?", "Présentez une polémique récente et les arguments de chaque camp."],
    examens: DELF_TCF_TEF,
  },
  {
    id: "b2-ecologie",
    niveau: "B2",
    theme: "La transition écologique",
    resume: "Discuter des choix individuels et collectifs face au changement climatique.",
    lexique: [
      { mot: "l’empreinte carbone", indice: "Quantité de gaz à effet de serre émise par une personne, un produit ou une activité.", exemple: "Prendre le train réduit fortement son empreinte carbone." },
      { mot: "la sobriété", indice: "Fait de limiter volontairement sa consommation d’énergie et de ressources.", exemple: "La sobriété énergétique passe par des gestes simples." },
      { mot: "la biodiversité", indice: "Ensemble des espèces vivantes, animales et végétales, d’un milieu.", exemple: "L’agriculture intensive menace la biodiversité." },
      { mot: "le circuit court", indice: "Vente directe, ou presque, du producteur au consommateur.", exemple: "Ce restaurant s’approvisionne en circuit court." },
      { mot: "durable", indice: "Qui répond aux besoins actuels sans compromettre ceux des générations futures.", exemple: "La ville mise sur un tourisme durable." },
      { mot: "la surconsommation", indice: "Fait d’acheter et d’utiliser bien plus que ce dont on a besoin.", exemple: "La mode à bas prix encourage la surconsommation." },
      { mot: "les gaz à effet de serre", indice: "Ils retiennent la chaleur dans l’atmosphère ; le dioxyde de carbone en fait partie.", exemple: "Les transports émettent une grande part des gaz à effet de serre." },
      { mot: "la pénurie", indice: "Manque d’un produit ou d’une ressource nécessaire.", exemple: "La sécheresse a provoqué une pénurie d’eau." },
    ],
    expressions: ["à l’échelle individuelle / à l’échelle collective", "réduire sa consommation d’énergie", "des mesures incitatives ou contraignantes", "faire évoluer les comportements", "à court terme / à long terme"],
    modele: "Pour limiter les émissions de gaz à effet de serre, deux voies se dessinent. La première mise sur la technologie ; la seconde, sur la sobriété, c’est-à-dire une remise en question de la surconsommation. Acheter en circuit court, réduire son empreinte carbone, préserver la biodiversité : ces choix individuels dessinent un mode de vie plus durable, mais ils ne suffiront pas sans politiques publiques. Faute de quoi, la pénurie de ressources imposera demain ce que nous refusons de choisir aujourd’hui.",
    aLoral: ["La sobriété est-elle compatible avec la croissance économique ?", "Les gestes individuels suffisent-ils face au changement climatique ?", "Faut-il taxer davantage les produits les plus polluants ?"],
    examens: DELF_TCF_TEF,
  },
  {
    id: "b2-numerique",
    niveau: "B2",
    theme: "Le numérique et l’emploi",
    resume: "Analyser les effets de l’automatisation sur les métiers et les compétences.",
    lexique: [
      { mot: "l’automatisation", indice: "Remplacement du travail humain par des machines ou des logiciels.", exemple: "L’automatisation transforme les métiers de la comptabilité." },
      { mot: "la reconversion", indice: "Changement de métier, souvent après une formation.", exemple: "À quarante ans, elle a entamé une reconversion dans le soin." },
      { mot: "la formation continue", indice: "Apprentissage suivi par les adultes tout au long de leur carrière.", exemple: "La formation continue aide les salariés à s’adapter." },
      { mot: "les données personnelles", indice: "Informations qui permettent d’identifier quelqu’un : nom, adresse, habitudes d’achat.", exemple: "Cette application collecte trop de données personnelles." },
      { mot: "un algorithme", indice: "Suite d’instructions qu’un programme suit pour trier, classer ou recommander.", exemple: "Un algorithme choisit les vidéos qui vous sont proposées." },
      { mot: "la précarité", indice: "Situation instable, sans garantie de revenu ni d’emploi durable.", exemple: "Les livreurs à vélo dénoncent la précarité de leur statut." },
      { mot: "une compétence", indice: "Capacité reconnue à accomplir une tâche, acquise par la formation ou l’expérience.", exemple: "Parler deux langues est une compétence recherchée." },
      { mot: "le marché du travail", indice: "Ensemble des offres et des demandes d’emploi.", exemple: "Les jeunes diplômés arrivent sur le marché du travail." },
    ],
    expressions: ["être remplacé par une machine", "se former tout au long de la vie", "protéger ses données", "creuser les inégalités", "un métier d’avenir"],
    modele: "L’automatisation ne détruit pas seulement des emplois : elle transforme les compétences attendues sur le marché du travail. Les salariés dont les tâches sont confiées à un algorithme devront envisager une reconversion, ce qui suppose un accès réel à la formation continue. Sans cela, la précarité risque de s’étendre. Reste la question des données personnelles, que ces outils exploitent massivement et dont l’usage demeure trop peu encadré.",
    aLoral: ["Votre métier pourrait-il être automatisé ? Pourquoi ?", "Faut-il craindre l’intelligence artificielle au travail ?", "Êtes-vous prêt à partager vos données personnelles en échange d’un service gratuit ?"],
    examens: DELF_TCF_TEF,
  },

  // ─────────────────────────── C1 ───────────────────────────
  {
    id: "c1-economie",
    niveau: "C1",
    theme: "Économie et société",
    resume: "Le lexique des pages économiques, pour comprendre et commenter l’actualité.",
    lexique: [
      { mot: "la conjoncture", indice: "Situation économique d’ensemble à un moment donné.", exemple: "La conjoncture incite les entreprises à la prudence." },
      { mot: "le pouvoir d’achat", indice: "Quantité de biens et de services qu’un revenu permet d’acquérir.", exemple: "L’inflation rogne le pouvoir d’achat des ménages." },
      { mot: "la délocalisation", indice: "Transfert d’une activité vers un pays où les coûts sont plus faibles.", exemple: "La délocalisation de l’usine a supprimé deux cents emplois." },
      { mot: "la fiscalité", indice: "Ensemble des règles et des prélèvements relatifs à l’impôt.", exemple: "Le gouvernement veut alléger la fiscalité des petites entreprises." },
      { mot: "la sous-traitance", indice: "Fait de confier une partie de sa production à une autre entreprise.", exemple: "Le constructeur recourt à la sous-traitance pour les pièces détachées." },
      { mot: "une récession", indice: "Recul durable de l’activité économique.", exemple: "Le pays est entré en récession au deuxième trimestre." },
      { mot: "le déficit", indice: "Situation où les dépenses dépassent les recettes.", exemple: "Le déficit public se creuse." },
      { mot: "un plan social", indice: "Ensemble de mesures qui accompagnent des licenciements économiques.", exemple: "La direction a annoncé un plan social." },
    ],
    expressions: ["tirer la sonnette d’alarme", "peser sur les finances publiques", "relancer l’activité", "un climat social tendu", "à l’aune de ces chiffres"],
    modele: "Dans une conjoncture morose, le gouvernement se trouve pris en étau : relancer l’activité sans creuser le déficit. La hausse des prix érode le pouvoir d’achat, tandis que plusieurs groupes annoncent des plans sociaux, conséquence de délocalisations décidées de longue date. Faut-il alléger la fiscalité pour retenir les entreprises, au risque d’aggraver les comptes publics ? Les économistes divergent, mais tous redoutent qu’une récession ne vienne fragiliser davantage les salariés de la sous-traitance.",
    aLoral: ["L’État doit-il intervenir pour empêcher les délocalisations ?", "Le pouvoir d’achat est-il un bon indicateur du bien-être ?", "Présentez la conjoncture économique de votre pays."],
    examens: DALF_TCF,
  },
  {
    id: "c1-sciences",
    niveau: "C1",
    theme: "Sciences et éthique",
    resume: "Les mots pour débattre des limites et des responsabilités de la recherche.",
    lexique: [
      { mot: "la déontologie", indice: "Ensemble des règles morales propres à une profession.", exemple: "La déontologie interdit au médecin de divulguer ces informations." },
      { mot: "le principe de précaution", indice: "Règle qui invite à prévenir un risque grave sans attendre la certitude scientifique.", exemple: "Au nom du principe de précaution, le produit a été retiré du marché." },
      { mot: "un essai clinique", indice: "Étude menée sur des volontaires pour évaluer un traitement.", exemple: "Le vaccin entre dans la dernière phase de l’essai clinique." },
      { mot: "le consentement éclairé", indice: "Accord donné par une personne après avoir reçu une information complète.", exemple: "Aucune intervention n’est possible sans le consentement éclairé du patient." },
      { mot: "une dérive", indice: "Évolution progressive vers un usage abusif ou dangereux.", exemple: "Les chercheurs alertent sur les dérives possibles de cette technique." },
      { mot: "la vulgarisation", indice: "Fait de rendre des connaissances spécialisées accessibles au grand public.", exemple: "Ce magazine de vulgarisation scientifique s’adresse aux adolescents." },
      { mot: "une percée", indice: "Progrès décisif dans un domaine de recherche.", exemple: "Cette découverte constitue une percée dans le traitement du diabète." },
      { mot: "un moratoire", indice: "Suspension provisoire d’une activité, décidée le temps d’en évaluer les effets.", exemple: "Plusieurs pays réclament un moratoire sur cette technologie." },
    ],
    expressions: ["soulever des questions éthiques", "franchir une ligne rouge", "faire l’objet d’un débat", "au nom du progrès", "encadrer une pratique"],
    modele: "Chaque percée scientifique soulève la même interrogation : tout ce qui est possible est-il souhaitable ? Les essais cliniques sont encadrés par une déontologie stricte et supposent le consentement éclairé des volontaires. Mais pour les techniques les plus récentes, le droit accuse un retard : certains chercheurs réclament un moratoire au nom du principe de précaution, quand d’autres y voient un frein. Entre ces positions, la vulgarisation joue un rôle décisif : sans citoyens informés, comment prévenir les dérives ?",
    aLoral: ["Faut-il fixer des limites à la recherche scientifique ?", "Qui doit décider de ce qui est acceptable : les scientifiques, les élus ou les citoyens ?", "Présentez une avancée scientifique récente et les questions qu’elle pose."],
    examens: DALF_TCF,
  },
  {
    id: "c1-connecteurs",
    niveau: "C1",
    theme: "Articuler un discours soutenu",
    resume: "Huit connecteurs et locutions qui structurent un exposé ou un essai de niveau C1.",
    lexique: [
      { mot: "néanmoins", indice: "Introduit une restriction après une affirmation ; équivalent soutenu de « pourtant ».", exemple: "Le projet est coûteux ; il reste néanmoins indispensable." },
      { mot: "en revanche", indice: "Oppose deux éléments en soulignant un contraste.", exemple: "Les ventes reculent en Europe ; en revanche, elles progressent en Asie." },
      { mot: "de surcroît", indice: "Ajoute un argument qui renforce le précédent : « en plus ».", exemple: "La mesure est inefficace et, de surcroît, injuste." },
      { mot: "en l’occurrence", indice: "Signifie « dans le cas présent ».", exemple: "Un responsable doit rendre des comptes ; en l’occurrence, il s’agit du directeur." },
      { mot: "a fortiori", indice: "Signifie « à plus forte raison ».", exemple: "Cette règle vaut pour les adultes et, a fortiori, pour les enfants." },
      { mot: "d’emblée", indice: "Signifie « dès le début, immédiatement ».", exemple: "L’auteur annonce d’emblée sa thèse." },
      { mot: "somme toute", indice: "Introduit un bilan : « tout bien considéré ».", exemple: "Somme toute, le bilan de cette expérience est positif." },
      { mot: "à cet égard", indice: "Signifie « sur ce point, de ce point de vue ».", exemple: "Le rapport est sévère ; à cet égard, il rejoint les critiques des associations." },
    ],
    expressions: ["Force est de constater que…", "Il n’en reste pas moins que…", "Quoi qu’il en soit, …", "Autant dire que…", "Encore faut-il que…"],
    modele: "La réforme était nécessaire ; elle a néanmoins été mal expliquée. D’emblée, le ministère a privilégié la rapidité et, de surcroît, négligé la concertation. Les enseignants, en l’occurrence les premiers concernés, n’ont pas été consultés ; les parents, a fortiori, ont été tenus à l’écart. Les résultats, en revanche, sont encourageants. Somme toute, la méthode a desservi le projet : à cet égard, le rapport parlementaire est sans ambiguïté.",
    aLoral: ["Reformulez un article d’actualité en utilisant au moins quatre de ces connecteurs.", "Présentez les avantages et les limites d’une réforme récente.", "Concluez un exposé en trois phrases avec « somme toute » et « à cet égard »."],
    examens: DALF_TCF,
  },

  // ─────────────────────────── C2 ───────────────────────────
  {
    id: "c2-idiomes",
    niveau: "C2",
    theme: "Expressions idiomatiques",
    resume: "Des expressions imagées fréquentes dans la presse et à l’oral, à comprendre et à employer avec justesse.",
    lexique: [
      { mot: "mettre la charrue avant les bœufs", indice: "Faire les choses dans le mauvais ordre.", exemple: "Recruter avant d’avoir un budget, c’est mettre la charrue avant les bœufs." },
      { mot: "couper l’herbe sous le pied", indice: "Devancer quelqu’un pour le priver d’un avantage.", exemple: "En publiant ses résultats la veille, elle a coupé l’herbe sous le pied de ses concurrents." },
      { mot: "noyer le poisson", indice: "Embrouiller volontairement une affaire pour éviter de répondre.", exemple: "Interrogé sur les chiffres, le ministre a noyé le poisson." },
      { mot: "jeter de l’huile sur le feu", indice: "Aggraver un conflit par ses paroles ou par ses actes.", exemple: "Cette déclaration n’a fait que jeter de l’huile sur le feu." },
      { mot: "tirer son épingle du jeu", indice: "Se sortir habilement d’une situation délicate, en préservant ses intérêts.", exemple: "Malgré la crise, cette petite entreprise tire son épingle du jeu." },
      { mot: "avoir du pain sur la planche", indice: "Avoir beaucoup de travail devant soi.", exemple: "Avec cette réforme, les enseignants ont du pain sur la planche." },
      { mot: "ne pas mâcher ses mots", indice: "S’exprimer avec une franchise brutale.", exemple: "Dans son rapport, la commission ne mâche pas ses mots." },
      { mot: "faire long feu", indice: "Ne pas atteindre son but, échouer.", exemple: "La première version du projet a fait long feu." },
    ],
    expressions: ["donner du fil à retordre", "mettre de l’eau dans son vin", "être au pied du mur", "renvoyer dos à dos", "faire la sourde oreille"],
    modele: "En annonçant la réforme avant toute concertation, le gouvernement a mis la charrue avant les bœufs. L’opposition, qui ne mâche pas ses mots, a aussitôt jeté de l’huile sur le feu. Interrogé à la radio, le ministre a tenté de noyer le poisson, sans convaincre. Seule une députée centriste tire son épingle du jeu : en proposant sa propre version du texte, elle a coupé l’herbe sous le pied de ses rivaux. La première mouture ayant fait long feu, les négociateurs ont désormais du pain sur la planche.",
    aLoral: ["Racontez un épisode de l’actualité en employant trois de ces expressions.", "Existe-t-il des expressions équivalentes dans votre langue ? Comparez les images.", "Expliquez la différence entre « faire long feu » et « ne pas faire long feu »."],
    examens: DALF_TCF,
  },
  {
    id: "c2-figures",
    niveau: "C2",
    theme: "Figures de style et analyse de texte",
    resume: "Nommer les procédés d’écriture pour commenter un texte avec précision.",
    lexique: [
      { mot: "la litote", indice: "Dire moins pour faire entendre plus.", exemple: "« Ce n’est pas mauvais » pour « c’est excellent »." },
      { mot: "l’euphémisme", indice: "Atténuer une réalité jugée brutale ou déplaisante.", exemple: "« Il nous a quittés » pour « il est mort »." },
      { mot: "l’antiphrase", indice: "Dire le contraire de ce que l’on pense, par ironie.", exemple: "« Quel beau temps ! » sous une pluie battante." },
      { mot: "l’oxymore", indice: "Associer deux termes de sens opposés.", exemple: "« Un silence assourdissant », « une douce violence »." },
      { mot: "l’anaphore", indice: "Répéter un mot ou un groupe de mots en tête de phrases successives.", exemple: "« Partout l’inquiétude, partout la colère, partout l’attente. »" },
      { mot: "l’hyperbole", indice: "Exagérer pour frapper l’esprit.", exemple: "« Je te l’ai dit mille fois. »" },
      { mot: "la périphrase", indice: "Remplacer un mot par une expression qui le décrit.", exemple: "« La Ville Lumière » pour Paris." },
      { mot: "la métaphore", indice: "Rapprocher deux réalités sans outil de comparaison.", exemple: "« Cet homme est un roc. »" },
    ],
    expressions: ["L’auteur recourt à…", "Ce procédé met en relief…", "Le ton se fait ironique lorsque…", "La chute du texte repose sur…", "Tout l’extrait est construit sur une opposition entre…"],
    modele: "Dans cet éditorial, l’ironie affleure partout. L’auteur qualifie la réforme de « modeste révolution », oxymore qui en dit long ; il juge le ministre « pas tout à fait convaincant », litote assassine. L’anaphore de « on nous promet » scande le deuxième paragraphe, avant qu’une hyperbole (« des siècles de retard ») ne vienne forcer le trait. Quant à la périphrase « le locataire de Matignon », elle met à distance celui qu’un euphémisme final dit simplement « appelé à d’autres fonctions ».",
    aLoral: ["Relevez trois figures de style dans un éditorial récent et commentez leur effet.", "Quelle différence faites-vous entre une litote et un euphémisme ?", "Improvisez un court éloge ironique en utilisant l’antiphrase."],
    examens: DALF_TCF,
  },
  {
    id: "c2-international",
    niveau: "C2",
    theme: "Politique et relations internationales",
    resume: "Le vocabulaire des rubriques internationales, pour suivre et commenter un débat de fond.",
    lexique: [
      { mot: "la souveraineté", indice: "Pouvoir suprême d’un État, qui n’est soumis à aucun autre sur son territoire.", exemple: "Le traité est accusé de porter atteinte à la souveraineté nationale." },
      { mot: "l’ingérence", indice: "Intervention d’un État dans les affaires intérieures d’un autre.", exemple: "Le gouvernement dénonce une ingérence étrangère dans la campagne." },
      { mot: "un embargo", indice: "Interdiction de commercer avec un pays, décidée pour faire pression sur lui.", exemple: "L’embargo sur les armes a été prolongé." },
      { mot: "le multilatéralisme", indice: "Coopération entre de nombreux États au sein d’institutions communes.", exemple: "La crise a fragilisé le multilatéralisme." },
      { mot: "ratifier", indice: "Approuver officiellement un accord international pour le rendre applicable.", exemple: "Le Parlement doit encore ratifier la convention." },
      { mot: "un droit de veto", indice: "Pouvoir de bloquer seul une décision collective.", exemple: "La résolution s’est heurtée au droit de veto d’un membre permanent." },
      { mot: "une trêve", indice: "Suspension provisoire des combats.", exemple: "Les deux camps ont conclu une trêve de dix jours." },
      { mot: "un rapport de force", indice: "Relation dans laquelle chacun tente d’imposer sa volonté grâce à sa puissance.", exemple: "Les négociations traduisent un rapport de force défavorable aux petits États." },
    ],
    expressions: ["sur l’échiquier international", "brandir la menace de sanctions", "un bras de fer diplomatique", "se poser en médiateur", "faire front commun"],
    modele: "Le sommet s’est ouvert dans un climat de bras de fer. Plusieurs capitales dénoncent une ingérence et invoquent leur souveraineté pour refuser de ratifier le texte. Les partisans du multilatéralisme redoutent qu’un droit de veto ne paralyse à nouveau l’institution. Sur le terrain, la trêve reste fragile et l’embargo, loin d’infléchir le rapport de force, pèse d’abord sur les populations civiles.",
    aLoral: ["Le multilatéralisme est-il en crise ? Argumentez.", "Les sanctions économiques sont-elles efficaces ?", "Présentez un conflit ou une négociation internationale en restant factuel."],
    examens: DALF_TCF,
  },
];

export const themeFiche = (id: string) => THEMES.find((t) => t.id === id);

/** Identifiant de l’activité (quiz) associée à une fiche thématique. */
export const idQuizLexique = (themeId: string) => `lexique-${themeId}`;

/**
 * Quiz générés à partir du lexique : une question par mot, les deux autres choix
 * étant pris dans la même fiche (positions fixes, pour un résultat reproductible).
 */
export function activitesLexique(): Activite[] {
  return THEMES.map((t): Activite => {
    const n = t.lexique.length;
    return {
      id: idQuizLexique(t.id),
      type: "qcm",
      titre: `Lexique : ${t.theme.charAt(0).toLowerCase()}${t.theme.slice(1)}`,
      niveau: t.niveau,
      competence: "LS",
      examens: t.examens,
      theme: t.theme,
      duree: 5,
      consigne: "Retrouvez le mot ou l’expression qui correspond à chaque définition.",
      items: t.lexique.map((e, i) => ({
        q: e.indice,
        options: [e.mot, t.lexique[(i + 2) % n].mot, t.lexique[(i + 5) % n].mot],
        bonne: 0,
        explication: `${e.mot.charAt(0).toUpperCase()}${e.mot.slice(1)}. Exemple : ${e.exemple}`,
      })),
    };
  });
}
