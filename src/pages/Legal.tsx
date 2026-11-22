import { useEffect } from "react";

/**
 * Conditions d’utilisation, confidentialité et mentions.
 * Modèle à compléter par l’éditeur (passages entre crochets) et à faire relire par un professionnel du droit.
 */
export default function Legal({ page }: { page?: string }) {
  useEffect(() => {
    if (page) document.getElementById(page)?.scrollIntoView();
  }, [page]);
  return (
    <article className="pile legal">
      <a href="#/" className="retour">← Accueil</a>
      <h1>Conditions et confidentialité</h1>
      <nav className="sommaire" aria-label="Sommaire">
        <a href="#/legal/conditions">Conditions d’utilisation</a>
        <a href="#/legal/confidentialite">Confidentialité</a>
        <a href="#/legal/mentions">Mentions et non-affiliation</a>
      </nav>

      <section className="carte" id="conditions">
        <h2>Conditions d’utilisation</h2>
        <p>Tremplin FLE est un outil d’entraînement aux examens de français langue étrangère, édité par [nom ou raison sociale de l’éditeur], joignable à l’adresse [adresse électronique de contact].</p>
        <h3>Accès</h3>
        <p>Chaque compte (élève ou professeur) bénéficie d’un essai gratuit de 14 jours, puis d’un accès payant, activé par un abonnement ou un code d’activation. Sans accès actif, les contenus restent consultables, mais les résultats ne sont plus enregistrés, l’IA n’est plus disponible et le lien entre élève et professeur est suspendu. Tremplin ne prend aucune commission sur les cours : l’organisation et le paiement des cours relèvent uniquement de l’élève et de son professeur.</p>
        <h3>Nature des résultats</h3>
        <p>Les notes, niveaux estimés et corrections sont indicatifs. Les corrections automatiques sont produites par une intelligence artificielle et peuvent comporter des erreurs. Seuls les organismes certificateurs délivrent des résultats officiels.</p>
        <h3>Utilisation</h3>
        <p>Chacun s’engage à utiliser la messagerie avec respect et à ne pas y publier de contenus illicites. Les élèves mineurs utilisent l’application avec l’accord de leurs parents ou de leur représentant légal.</p>
        <h3>Contenus</h3>
        <p>Les fiches, activités et examens blancs sont des créations originales de Tremplin FLE. Ils ne reprennent aucun sujet officiel et ne peuvent pas être reproduits sans autorisation.</p>
      </section>

      <section className="carte" id="confidentialite">
        <h2>Confidentialité des données</h2>
        <h3>Données collectées</h3>
        <ul>
          <li>Compte : adresse électronique, nom, rôle, objectif (examen, niveau, date), langue des explications.</li>
          <li>Activité : réponses, productions écrites, transcriptions de prises de parole, résultats, plan d’amélioration, devoirs, messages.</li>
          <li>Accès : dates d’essai et d’abonnement, codes d’activation utilisés.</li>
        </ul>
        <p>Les enregistrements audio des prises de parole restent sur l’appareil de l’élève : ils ne sont jamais envoyés.</p>
        <h3>Finalités et destinataires</h3>
        <p>Les données servent uniquement à faire fonctionner le service. Un professeur ne voit les données d’un élève que si l’élève a accepté le lien, et seulement tant que le lien est actif. Les textes soumis à la correction sont transmis au fournisseur d’intelligence artificielle (Anthropic) pour être analysés. Les données sont hébergées par [hébergeur de la base de données, par exemple Supabase, et région d’hébergement].</p>
        <h3>Durée de conservation et droits</h3>
        <p>Les données sont conservées tant que le compte existe. Depuis « Mon compte », chacun peut télécharger ses données et supprimer son compte, ce qui efface définitivement ses résultats, devoirs, messages et liens. Pour toute autre demande (accès, rectification, opposition), écrivez à [adresse électronique de contact]. Ces droits s’exercent selon la législation applicable, par exemple la loi colombienne 1581 de 2012 sur la protection des données personnelles ou le RGPD pour les personnes situées dans l’Union européenne.</p>
        <h3>Stockage sur l’appareil</h3>
        <p>L’application garde sur votre appareil quelques préférences (thème, vitesse audio), vos brouillons et l’historique du tuteur. Aucun traceur publicitaire n’est utilisé.</p>
      </section>

      <section className="carte" id="mentions">
        <h2>Mentions et non-affiliation</h2>
        <p>Tremplin FLE est un service indépendant. Il n’est affilié à aucun organisme certificateur et n’est pas approuvé par eux. DELF, DALF, TCF et Ev@lang sont des examens de France Éducation international ; le TEF et les diplômes de français professionnel relèvent de la CCI Paris Île-de-France ; le Certificat Voltaire est un service de Woonoz. Ces noms sont cités uniquement pour désigner les examens préparés.</p>
        <p className="petit">Éditeur : [nom, adresse, identifiant légal]. Hébergement de l’application : [GitHub Pages ou autre hébergeur].</p>
      </section>
    </article>
  );
}
