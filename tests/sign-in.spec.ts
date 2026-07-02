import { expect, test } from "@/fixtures/page.fixture";

test.describe("Connexion", () => {
  test.beforeEach(async ({ signInPage }) => {
    await signInPage.goto();
    await signInPage.expectLoaded();
  });

  test.afterEach(async ({ page }) => {
    await page.context().clearCookies();
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test("connecte réellement un utilisateur existant", async ({
    page,
    testData,
    signInPage,
    signUpPage,
    dashboardPage,
  }) => {
    const user = await test.step("Préparer un utilisateur de test", async () =>
      testData.user());

    await test.step("Créer le compte utilisateur", async () => {
      await signUpPage.goto();
      await signUpPage.signUp(user);
      await expect(signUpPage.successAlert).toBeVisible();
    });

    await test.step("Nettoyer la session puis se reconnecter", async () => {
      await page.context().clearCookies();
      await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });

      await signInPage.goto();
      await signInPage.expectLoaded();
      await signInPage.signIn(user.email, user.password);
    });

    await test.step("Vérifier l'accès au dashboard", async () => {
      await dashboardPage.expectLoaded();
      await dashboardPage.expectUserEmailVisible(user.email);
    });
  });

  test("affiche les champs de connexion et les liens associés", async ({
    signInPage,
  }) => {
    await test.step("Vérifier les liens de récupération et d'inscription", async () => {
      await expect(signInPage.forgotPasswordLink).toBeVisible();
      await expect(signInPage.createAccountLink).toBeVisible();
    });
  });

  test("gère un email invalide", async ({ page, signInPage }) => {
    await test.step("Soumettre un format d'email invalide", async () => {
      await signInPage.signIn("email-invalide", "azertyuiop");
    });

    await test.step("Vérifier qu'on reste sur la page de connexion", async () => {
      await expect(page).toHaveURL(/\/sign-in$/);
      await expect(signInPage.emailInput).toHaveValue("email-invalide");
    });
  });

  test("refuse une connexion quand les champs sont vides", async ({
    page,
    signInPage,
  }) => {
    await test.step("Soumettre le formulaire vide", async () => {
      await signInPage.signIn("", "");
    });

    await test.step("Vérifier l'absence de navigation", async () => {
      await expect(page).toHaveURL(/\/sign-in$/);
      await expect(signInPage.emailInput).toHaveValue("");
    });
  });

  test("refuse une connexion avec des identifiants inconnus", async ({
    page,
    testData,
    signInPage,
  }) => {
    const unknownUser =
      await test.step("Préparer des identifiants inconnus", async () =>
        testData.user({
          email: `missing-${Date.now()}@test.com`,
          password: "wrong-password",
        }));

    await test.step("Tenter une connexion invalide", async () => {
      await signInPage.signIn(unknownUser.email, unknownUser.password);
    });

    await test.step("Vérifier l'alerte d'identifiants invalides", async () => {
      await expect(signInPage.invalidCredentialsAlert).toBeVisible();
      await expect(page).toHaveURL(/\/sign-in$/);
    });
  });

  test("fournit la navigation vers la page d'inscription", async ({
    page,
    signInPage,
  }) => {
    await test.step("Cliquer sur le lien d'inscription", async () => {
      await signInPage.goToSignUp();
    });

    await test.step("Vérifier la page d'inscription", async () => {
      await expect(page).toHaveURL(/\/sign-up$/);
      await expect(
        page.getByText("Créer un compte", { exact: true }),
      ).toBeVisible();
    });
  });

  test("fournit la navigation vers mot de passe oublié", async ({
    page,
    signInPage,
  }) => {
    await test.step("Cliquer sur mot de passe oublié", async () => {
      await signInPage.goToForgotPassword();
    });

    await test.step("Vérifier la navigation vers forgot-password", async () => {
      await expect(page).toHaveURL(/\/forgot-password$/);
    });
  });
});
