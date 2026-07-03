import { expect, test } from "@/fixtures/page.fixture";

test.use({ storageState: { cookies: [], origins: [] } });

const signInRoutePattern = "**/api/auth/sign-in**";

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

  test("simule une erreur serveur lors de la connexion", async ({
    page,
    signInPage,
  }) => {
    let intercepted = false;

    await page.route(signInRoutePattern, async (route) => {
      intercepted = true;

      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({
          ok: false,
          message: "Internal Server Error",
        }),
      });
    });

    await test.step("Soumettre le formulaire de connexion", async () => {
      await signInPage.signIn("server-error@test.com", "Password123!");
    });

    await test.step("Vérifier que la page reste sur la connexion", async () => {
      expect(intercepted).toBe(true);
      await expect(page).toHaveURL(/\/sign-in$/);
    });
  });

  test("simule un réseau lent lors de la connexion", async ({
    page,
    signInPage,
  }) => {
    await page.route(signInRoutePattern, async (route) => {
      await new Promise((resolve) => {
        setTimeout(resolve, 1200);
      });

      await route.fulfill({
        status: 401,
        contentType: "application/json",
        body: JSON.stringify({
          error: "Invalid email or password",
        }),
      });
    });

    const startedAt = performance.now();

    await test.step("Soumettre la connexion avec délai", async () => {
      await signInPage.signIn("slow-network@test.com", "wrong-password");
    });

    await test.step("Attendre l'erreur après le délai réseau", async () => {
      await expect(signInPage.invalidCredentialsAlert).toBeVisible();
      expect(performance.now() - startedAt).toBeGreaterThanOrEqual(1100);
    });
  });

  test("bloque la requête de connexion", async ({ page, signInPage }) => {
    let intercepted = false;

    await page.route(signInRoutePattern, async (route) => {
      intercepted = true;
      await route.abort("blockedbyclient");
    });

    await test.step("Tenter de se connecter avec une requête bloquée", async () => {
      await signInPage.signIn("blocked@test.com", "Password123!");
    });

    await test.step("Vérifier que la connexion n'a pas quitté la page", async () => {
      expect(intercepted).toBe(true);
      await expect(page).toHaveURL(/\/sign-in$/);
    });
  });
});
