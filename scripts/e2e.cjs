// Parcours complet en mode démonstration : node scripts/e2e.cjs [url]
// Joue l'élève puis le professeur dans le même navigateur (données locales partagées).
const { chromium } = require("playwright");
const URL = process.argv[2] || "http://localhost:4173/";
const OUT = process.env.SHOTS || "/tmp/e2e/shots";

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  const erreurs = [];
  page.on("pageerror", (e) => erreurs.push(e.message));
  page.on("console", (m) => m.type() === "error" && erreurs.push(m.text()));
  const shot = (n) => page.screenshot({ path: `${OUT}/${n}.png`, fullPage: true });
  const ok = (cond, msg) => { if (!cond) throw new Error("ÉCHEC : " + msg); console.log("✓ " + msg); };

  const connexion = async (role, nom, email) => {
    await page.goto(URL);
    await page.getByText(role === "eleve" ? "Je prépare un examen" : "J’accompagne des élèves").click();
    await page.getByLabel("Prénom et nom").fill(nom);
    await page.getByLabel("Adresse électronique").fill(email);
    await page.getByRole("button", { name: "Entrer" }).click();
    await page.waitForSelector(".entete");
  };
  const deconnexion = async () => { await page.goto(URL + "#/compte"); await page.getByRole("button", { name: "Se déconnecter" }).click(); await page.waitForSelector(".connexion"); };

  // 1. Élève : inscription, objectif, invitation du professeur
  await page.goto(URL); await shot("01-connexion");
  await connexion("eleve", "Lucía Gómez", "lucia@exemple.com");
  ok(await page.getByRole("heading", { name: /Bonjour Lucía/ }).isVisible(), "accueil élève affiché");
  await page.getByLabel("Examen visé").selectOption("delf");
  await page.getByLabel("Niveau visé").selectOption("B1");
  await page.goto(URL + "#/liens");
  await page.getByLabel("Adresse électronique").fill("prof@exemple.com");
  await page.getByRole("button", { name: "Inviter" }).click();
  ok(await page.getByText("Invitation enregistrée").isVisible(), "invitation envoyée au professeur");

  // 2. Élève : QCM de compréhension écrite
  await page.goto(URL + "#/activite/b1-ce-teletravail");
  const questions = page.locator(".question");
  const n = await questions.count();
  for (let i = 0; i < n; i++) await questions.nth(i).locator(".option").first().click();
  await page.getByRole("button", { name: "Valider mes réponses" }).click();
  ok(await page.getByText(/Résultat : \d \/ 5/).isVisible(), "QCM corrigé avec explications");
  ok(await page.getByText("Résultat enregistré dans vos progrès.").isVisible(), "résultat QCM enregistré");
  await shot("02-qcm-corrige");

  // 3. Élève : texte à trous (accents)
  await page.goto(URL + "#/activite/b1-ls-imparfait-pc");
  const champs = ["etais", "pleuvait", "a sonné", "déjeunions", "a compris"];
  for (let i = 0; i < champs.length; i++) await page.getByLabel(`Réponse ${i + 1}`).fill(champs[i]);
  await page.getByRole("button", { name: "Valider" }).click();
  ok(await page.getByText("Presque : vérifiez les accents.").isVisible(), "faute d’accent signalée");
  ok(await page.getByText("Résultat : 4 / 5").isVisible(), "texte à trous noté 4/5");
  await shot("03-trous");

  // 4. Élève : production écrite (correction de démonstration)
  await page.goto(URL + "#/activite/b1-pe-forum");
  const texte = ("À mon avis, ce projet est une bonne idée. D’abord, le centre-ville serait plus calme et moins pollué. " +
    "De plus, les familles pourraient se promener sans danger. Cependant, les commerçants ont peur de perdre des clients. ").repeat(4);
  await page.getByLabel("Votre texte").fill(texte);
  await page.getByRole("button", { name: "Envoyer à la correction IA" }).click();
  await page.getByRole("heading", { name: "Correction" }).waitFor();
  ok(await page.getByText(/Connecteurs repérés/).isVisible(), "production corrigée (mode démo)");
  await shot("04-production");

  // 5. Élève : tâche orale (auto-évaluation)
  await page.goto(URL + "#/activite/b1-po-point-de-vue");
  await page.locator(".case input").nth(0).check();
  await page.locator(".case input").nth(1).check();
  await page.getByRole("button", { name: "Enregistrer mon auto-évaluation" }).click();
  ok(await page.getByText("Auto-évaluation : 2 / 5").isVisible(), "tâche orale auto-évaluée");

  // 6. Élève : progrès et plan
  await page.goto(URL + "#/progres");
  ok((await page.locator(".historique > li").count()) === 4, "4 activités dans l’historique");
  await page.getByRole("button", { name: /Générer mon plan/ }).click();
  await page.getByText(/Compétence à travailler en priorité/).waitFor();
  ok(true, "plan d’amélioration généré");
  await shot("05-progres");
  await deconnexion();

  // 7. Professeur : inscription, acceptation, suivi de l’élève
  await connexion("professeur", "Edwin Martín", "prof@exemple.com");
  await page.goto(URL + "#/liens");
  ok(await page.getByText("souhaite se lier à votre compte").isVisible(), "le professeur voit l’invitation de l’élève");
  await page.getByRole("button", { name: "Accepter" }).click();
  await page.getByText("lié", { exact: true }).waitFor();
  ok(true, "lien accepté");
  await page.goto(URL + "#/");
  await page.getByRole("link", { name: "Lucía Gómez" }).click();
  await page.getByRole("heading", { name: "Progrès de Lucía Gómez" }).waitFor();
  ok((await page.locator(".historique > li").count()) === 4, "le professeur voit les 4 activités de l’élève");
  ok(await page.getByText(/Compétence à travailler en priorité/).isVisible(), "le professeur voit le plan de l’élève");
  await page.locator(".ligne-hist").filter({ hasText: "Forum" }).click();
  await page.getByLabel("Commentaire du professeur").fill("Bon plan. Varie les connecteurs et relis les accords.");
  await page.getByLabel("Note /20 (facultatif)").fill("13");
  await page.getByRole("button", { name: "Enregistrer", exact: true }).click();
  ok(await page.getByText("Commentaire enregistré").isVisible(), "commentaire et note du professeur");
  await page.getByRole("button", { name: "Assigner une activité" }).click();
  await page.locator(".modale select").selectOption("b2-ls-subjonctif");
  await page.locator(".modale").getByLabel(/Consigne personnelle/).fill("Révise la fiche sur le subjonctif avant.");
  await page.locator(".modale").getByRole("button", { name: "Envoyer" }).click();
  await page.getByText("à faire").first().waitFor();
  ok(true, "devoir assigné");
  await page.getByLabel("Votre message").fill("Bravo pour ton travail cette semaine !");
  await page.locator(".fil-messages").getByRole("button", { name: "Envoyer" }).click();
  await page.getByText("Bravo pour ton travail").waitFor();
  ok(true, "message envoyé à l’élève");
  await shot("06-prof-eleve");
  await deconnexion();

  // 8. Élève : retour du professeur, devoir, message
  await connexion("eleve", "Lucía Gómez", "lucia@exemple.com");
  ok(await page.getByText("Subjonctif ou indicatif ?").isVisible(), "l’élève voit le devoir sur l’accueil");
  ok(await page.getByText("« Révise la fiche sur le subjonctif avant. »").isVisible(), "avec la consigne du professeur");
  await shot("07-accueil-eleve");
  await page.getByRole("link", { name: "Subjonctif ou indicatif ?" }).click();
  await page.getByText("Devoir de votre professeur.").waitFor();
  const qs = page.locator(".question");
  for (let i = 0; i < (await qs.count()); i++) await qs.nth(i).locator(".option").first().click();
  await page.getByRole("button", { name: "Valider mes réponses" }).click();
  ok(await page.getByText("devoir rendu à votre professeur").isVisible(), "devoir rendu");
  await page.goto(URL + "#/progres");
  await page.locator(".ligne-hist").filter({ hasText: "Forum" }).click();
  ok(await page.getByText("Varie les connecteurs").isVisible(), "l’élève lit le commentaire du professeur");
  await page.goto(URL + "#/messages");
  ok(await page.getByText("Bravo pour ton travail cette semaine !").isVisible(), "l’élève lit le message");

  // 9. Pages de contenu, mobile et thème sombre
  await page.goto(URL + "#/examens/delf"); await shot("08-examen-delf");
  await page.goto(URL + "#/fiche/b2-subjonctif"); await shot("09-fiche");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => (document.documentElement.dataset.theme = "sombre"));
  await page.goto(URL + "#/activite/a1-ce-message"); await shot("10-mobile-sombre");
  ok(await page.locator(".nav-bas").isVisible(), "navigation mobile visible");

  ok(erreurs.length === 0, "aucune erreur JavaScript" + (erreurs.length ? " : " + erreurs.join(" | ") : ""));
  await browser.close();
})().catch((e) => { console.error(e.message); process.exit(1); });
