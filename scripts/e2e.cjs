// Parcours complet en mode démonstration : node scripts/e2e.cjs [url]
// Joue l’élève puis le professeur dans le même navigateur (données locales partagées).
const { chromium } = require("playwright");
const URL = process.argv[2] || "http://localhost:4173/";
const OUT = process.env.SHOTS || "/tmp/e2e/shots";

(async () => {
  require("fs").mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  const erreurs = [];
  page.on("pageerror", (e) => erreurs.push(e.message));
  page.on("console", (m) => m.type() === "error" && erreurs.push(m.text()));
  let n = 0;
  const shot = (nom) => page.screenshot({ path: `${OUT}/${nom}.png`, fullPage: true });
  const ok = (cond, msg) => { if (!cond) throw new Error("ÉCHEC : " + msg); n++; console.log("✓ " + msg); };
  const voir = async (texte, msg) => { await page.getByText(texte).first().waitFor({ timeout: 6000 }); ok(true, msg); };
  const repondreQcm = async () => {
    await page.locator(".question").first().waitFor();
    const qs = page.locator(".question");
    for (let i = 0; i < (await qs.count()); i++) await qs.nth(i).locator(".option").first().click();
    await page.getByRole("button", { name: "Valider mes réponses" }).click();
  };
  const connexion = async (role, nom, email) => {
    await page.goto(URL);
    await page.getByText(role === "eleve" ? "Je prépare un examen" : "J’accompagne des élèves").click();
    await page.getByLabel("Prénom et nom").fill(nom);
    await page.getByLabel("Adresse électronique").fill(email);
    await page.getByRole("button", { name: "Entrer" }).click();
    await page.waitForSelector(".entete");
  };
  const deconnexion = async () => { await page.goto(URL + "#/compte"); await page.getByRole("button", { name: "Se déconnecter" }).click(); await page.waitForSelector(".connexion"); };
  const dansJours = (j) => { const d = new Date(); d.setDate(d.getDate() + j); return d.toISOString().slice(0, 10); };

  // 0. Page de connexion et pages légales accessibles sans compte
  await page.goto(URL); await shot("01-connexion");
  await page.getByRole("link", { name: "conditions d’utilisation" }).click();
  await voir("Mentions et non-affiliation", "conditions et confidentialité lisibles sans compte");

  // 1. Élève : inscription, test de niveau, objectif
  await connexion("eleve", "Lucía Gómez", "lucia@exemple.com");
  await voir("Commencez par situer votre niveau", "nouvel élève : la prochaine étape est le test de niveau");
  await page.getByRole("link", { name: "Passer le test de niveau" }).click();
  await page.getByRole("button", { name: "Commencer le test" }).click();
  for (let i = 0; i < 24; i++) {
    await page.locator(".option").first().click();
    await page.getByRole("button", { name: /Question suivante|Voir mon résultat/ }).click();
  }
  await voir("Votre niveau estimé", "test de niveau terminé : niveau estimé et détail par niveau");
  await shot("02-test-niveau");
  await page.goto(URL + "#/");
  await page.getByLabel("Examen visé").selectOption("delf");
  await page.getByLabel("Niveau visé").selectOption("B1");
  await page.getByLabel("Date de l’examen").fill(dansJours(30));
  await voir("J-30", "objectif enregistré : compte à rebours avant l’examen");

  // 2. Invitation du professeur, message prêt à partager
  await page.goto(URL + "#/liens");
  await page.getByLabel("Adresse électronique").fill("prof@exemple.com");
  await page.getByRole("button", { name: "Inviter" }).click();
  await voir("Invitation enregistrée", "invitation envoyée au professeur");
  ok(await page.getByRole("link", { name: "Envoyer par WhatsApp" }).isVisible(), "message d’invitation prêt à partager (WhatsApp, courriel, copie)");

  // 3. Activités : QCM, texte à trous, production écrite, oral avec transcription
  await page.goto(URL + "#/activite/b1-ce-teletravail");
  await repondreQcm();
  await voir(/Résultat : \d \/ 5/, "QCM corrigé avec explications");
  await voir("Activité suivante", "résultat enregistré, activité suivante proposée");
  await page.goto(URL + "#/activite/b1-ls-imparfait-pc");
  const champs = ["etais", "pleuvait", "a sonné", "déjeunions", "a compris"];
  for (let i = 0; i < champs.length; i++) await page.getByLabel(`Réponse ${i + 1}`).fill(champs[i]);
  await page.getByRole("button", { name: "Valider" }).click();
  await voir("Presque : vérifiez les accents.", "faute d’accent signalée (4/5)");
  await page.goto(URL + "#/activite/b1-pe-forum");
  await page.getByLabel("Votre texte").fill(("À mon avis, ce projet est une bonne idée. D’abord, le centre-ville serait plus calme. De plus, les familles pourraient se promener sans danger. Cependant, les commerçants ont peur de perdre des clients. ").repeat(4));
  await page.getByRole("button", { name: "Envoyer à la correction IA" }).click();
  await voir("Connecteurs repérés", "production écrite corrigée (mode démo)");
  await page.goto(URL + "#/activite/b1-po-point-de-vue");
  await page.getByLabel("Transcription (modifiable)").fill(("Ce document parle des réseaux sociaux. À mon avis, les adolescents passent trop de temps sur leur téléphone. D’abord, ils dorment moins. Ensuite, ils lisent moins. Pour conclure, il faut apprendre à les utiliser. ").repeat(2));
  await page.getByRole("button", { name: "Obtenir un retour sur ma prise de parole" }).click();
  await page.getByRole("heading", { name: "Correction" }).waitFor();
  await page.getByRole("button", { name: /Enregistrer \(note de l’IA/ }).click();
  await voir("Note enregistrée", "prise de parole transcrite, commentée et enregistrée");

  // 4. Révisions thématiques : cartes et quiz
  await page.goto(URL + "#/revisions/b1-travail");
  await page.getByRole("button", { name: "Cartes de mémorisation" }).click();
  await page.locator(".carte-memoire").click();
  await page.getByRole("button", { name: "Je savais" }).click();
  await voir("1 / 8 mots acquis", "cartes de mémorisation : progression enregistrée");
  await shot("03-cartes");
  await page.getByRole("link", { name: "Faire le quiz" }).click();
  await repondreQcm();
  await voir(/Résultat : \d \/ 8/, "quiz de lexique généré et noté");

  // 5. Progrès et plan d’amélioration structuré
  await page.goto(URL + "#/progres");
  await voir("Test de niveau :", "résultat du test visible dans les progrès");
  await page.getByRole("button", { name: "Créer mon plan" }).click();
  await voir("Semaine 1 : comprendre et pratiquer", "plan d’amélioration créé");
  ok((await page.locator(".lien-tache").count()) >= 3, "chaque tâche du plan renvoie à une fiche, une révision, une activité ou un examen blanc");
  await shot("04-plan");
  await page.goto(URL + "#/");
  await voir("jour d’affilée", "accueil : série et rythme de travail");
  await shot("05-accueil-eleve");

  // 6. Navigation mobile : menu « Plus »
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Plus" }).click();
  await page.getByRole("dialog", { name: "Toutes les rubriques" }).waitFor();
  await shot("06-menu-plus");
  await page.getByRole("dialog").getByRole("link", { name: "Révisions" }).click();
  await voir("Révisions thématiques", "menu « Plus » : toutes les rubriques accessibles sur téléphone");
  await page.setViewportSize({ width: 1280, height: 900 });

  // 7. Accès : code expiré puis code valide
  await page.goto(URL + "#/compte");
  await page.getByLabel("Code d’activation").fill("DEMO-EXPIRE");
  await page.getByRole("button", { name: "Activer le code" }).click();
  await voir("Votre accès a expiré :", "accès expiré : bandeau d’avertissement");
  await page.goto(URL + "#/activite/a1-ls-articles");
  await repondreQcm();
  await voir("le résultat n’est pas enregistré", "accès expiré : le résultat n’est pas enregistré");
  await page.goto(URL + "#/compte");
  await page.getByLabel("Code d’activation").fill("demo-30");
  await page.getByRole("button", { name: "Activer le code" }).click();
  await voir("Code accepté", "code d’activation accepté (minuscules acceptées)");
  await deconnexion();

  // 8. Professeur : invitation, alertes, correction, devoirs, examen blanc, message
  await connexion("professeur", "Edwin Martín", "prof@exemple.com");
  await page.goto(URL + "#/liens");
  await voir("souhaite se lier à votre compte", "le professeur voit l’invitation de l’élève");
  await page.getByRole("button", { name: "Accepter" }).click();
  await page.getByText("lié", { exact: true }).waitFor();
  await page.goto(URL + "#/");
  await voir("2 productions à corriger", "alerte : productions écrite et orale à corriger");
  ok(await page.getByText(/DELF B1 · J-30|DELF B1/).first().isVisible(), "le professeur voit l’objectif et la date d’examen de l’élève");
  await shot("07-accueil-prof");
  await page.getByRole("link", { name: "Lucía Gómez" }).first().click();
  await page.getByRole("heading", { name: "Progrès de Lucía Gómez" }).waitFor();
  await page.getByRole("button", { name: "À corriger (2)" }).click();
  ok((await page.locator(".historique > li").count()) === 2, "filtre « à corriger » : seulement les productions en attente");
  await page.locator(".ligne-hist").filter({ hasText: "Forum" }).click();
  await page.getByLabel("Commentaire du professeur").fill("Bon plan. Varie les connecteurs et relis les accords.");
  await page.getByLabel("Note /20 (facultatif)").fill("13");
  await page.getByRole("button", { name: "Enregistrer", exact: true }).click();
  await voir("Commentaire enregistré", "commentaire et note du professeur");
  await page.getByRole("button", { name: "Assigner une activité" }).click();
  await page.locator(".modale select").selectOption("b2-ls-subjonctif");
  await page.locator(".modale").getByLabel(/Consigne personnelle/).fill("Révise la fiche sur le subjonctif avant.");
  await page.locator(".modale").getByRole("button", { name: "Envoyer" }).click();
  await page.getByText("à faire").first().waitFor();
  await page.getByRole("button", { name: "Assigner une activité" }).click();
  await page.locator(".modale select").selectOption("b1-ls-relatifs");
  await page.locator(".modale").getByRole("button", { name: "Envoyer" }).click();
  await page.locator(".liste li").filter({ hasText: "Qui, que, où ou dont" }).getByRole("button", { name: "Retirer" }).click();
  await page.locator(".liste li").filter({ hasText: "Qui, que, où ou dont" }).waitFor({ state: "detached" });
  ok(true, "devoir assigné, puis devoir retiré par le professeur");
  await page.getByLabel("Votre message").fill("Bravo pour ton travail cette semaine !");
  await page.locator(".fil-messages").getByRole("button", { name: "Envoyer" }).click();
  await voir("Bravo pour ton travail", "message envoyé à l’élève");
  await page.goto(URL + "#/fiche/b1-conditionnel");
  await voir("Piste d’exploitation en classe", "fiche : piste d’exploitation visible par le professeur");
  await page.goto(URL + "#/examens-blancs/delf-b2-1");
  await page.getByRole("button", { name: "Assigner l’examen à un élève" }).click();
  await page.locator(".modale select").first().selectOption({ label: "Lucía Gómez" });
  await page.locator(".modale").getByRole("button", { name: "Envoyer" }).click();
  await voir("6 devoirs envoyés.", "examen blanc complet assigné (6 épreuves)");
  await deconnexion();

  // 9. Élève : retour du professeur, message non lu, devoir, examens blancs
  await connexion("eleve", "Lucía Gómez", "lucia@exemple.com");
  ok((await page.locator(".nav-haut .pastille").first().textContent()) === "1", "pastille : 1 message non lu");
  await voir("Un devoir de votre professeur vous attend", "accueil : le devoir devient la prochaine étape");
  await page.getByRole("link", { name: "Faire le devoir" }).click();
  await page.getByText("Devoir de votre professeur.").waitFor();
  await repondreQcm();
  await voir("devoir rendu à votre professeur", "devoir rendu");
  await page.goto(URL + "#/progres");
  await page.locator(".ligne-hist").filter({ hasText: "Forum" }).click();
  await voir("Varie les connecteurs", "l’élève lit le commentaire du professeur");
  await page.goto(URL + "#/messages");
  await voir("Bravo pour ton travail cette semaine !", "l’élève lit le message");
  await page.waitForTimeout(300);
  ok((await page.locator(".nav-haut .pastille").count()) === 0, "message lu : la pastille disparaît");
  await page.goto(URL + "#/examens-blancs");
  ok((await page.locator(".carte-lien").count()) === 4, "4 examens blancs : DELF A2, B1, B2 et DALF C1");
  await page.goto(URL + "#/examens-blancs/delf-b1-1");
  await page.getByRole("link", { name: /CO, document 1/ }).click();
  await page.getByText("Retour à l’examen blanc").waitFor();
  await repondreQcm();
  await page.getByText("Retour à l’examen blanc").click();
  await voir("1/2 parties faites", "examen blanc : avancement par épreuve");
  await page.goto(URL + "#/tuteur");
  await page.getByLabel("Votre question").fill("Quand faut-il employer le subjonctif ?");
  await page.getByRole("button", { name: "Envoyer" }).click();
  await voir("Fiche B2 : Le subjonctif", "tuteur sans IA : il renvoie vers la bonne fiche");

  // 10. Données personnelles : export puis suppression du compte
  await page.goto(URL + "#/compte");
  const [dl] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "Télécharger mes données" }).click()]);
  ok(/tremplin-mes-donnees-.*\.json/.test(dl.suggestedFilename()), "export des données personnelles (JSON)");
  await page.getByLabel("Confirmation de suppression").fill("SUPPRIMER");
  await page.getByRole("button", { name: "Supprimer définitivement" }).click();
  await page.waitForSelector(".connexion");
  ok(true, "suppression du compte : retour à la page de connexion");

  // 11. Pages de contenu, téléphone et thème sombre
  await connexion("professeur", "Edwin Martín", "prof@exemple.com");
  ok((await page.getByText("Aucun élève lié pour l’instant").count()) === 1, "après suppression de l’élève, ses données ne sont plus visibles");
  await page.goto(URL + "#/examens/delf"); await shot("08-examen-delf");
  await page.goto(URL + "#/fiche/b2-subjonctif"); await shot("09-fiche");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => (document.documentElement.dataset.theme = "sombre"));
  await page.goto(URL + "#/revisions/a2-logement"); await shot("10-mobile-sombre");
  ok(await page.locator(".nav-bas").isVisible(), "navigation mobile visible");
  const largeur = await page.evaluate(() => document.documentElement.scrollWidth);
  ok(largeur <= 390, `pas de défilement horizontal sur téléphone (${largeur}px)`);

  ok(erreurs.length === 0, "aucune erreur JavaScript" + (erreurs.length ? " : " + erreurs.join(" | ") : ""));
  console.log(`${n} vérifications réussies.`);
  await browser.close();
})().catch((e) => { console.error(e.message); process.exit(1); });
