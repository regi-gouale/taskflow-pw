import { signInTestCaseFactory } from "@/factories/sign-in.factory";
import { expect, test } from "@/fixtures/page.fixture";

test.use({ storageState: { cookies: [], origins: [] } });

const signInRoutePattern = "**/api/auth/sign-in**";

const signInValidationCases = signInTestCaseFactory.buildValidationCases();

const signInNavigationCases = signInTestCaseFactory.buildNavigationCases();

const signInNetworkCases = signInTestCaseFactory.buildNetworkCases();

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

  signInValidationCases.forEach((signInCase) => {
    test(signInCase.title, async ({ page, signInPage }) => {
      await test.step("Soumettre le formulaire de connexion", async () => {
        await signInPage.signIn(signInCase.email, signInCase.password);
      });

      await test.step("Vérifier qu'on reste sur la page de connexion", async () => {
        await expect(page).toHaveURL(/\/sign-in$/);
        await expect(signInPage.emailInput).toHaveValue(signInCase.email);
      });
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

  signInNavigationCases.forEach((navigationCase) => {
    test(navigationCase.title, async ({ page, signInPage }) => {
      await test.step("Déclencher la navigation", async () => {
        if (navigationCase.action === "sign-up") {
          await signInPage.goToSignUp();
          return;
        }

        await signInPage.goToForgotPassword();
      });

      await test.step("Vérifier la destination", async () => {
        await expect(page).toHaveURL(navigationCase.expectedUrl);

        if (navigationCase.shouldAssertCreateAccountHeading) {
          await expect(
            page.getByText("Créer un compte", { exact: true }),
          ).toBeVisible();
        }
      });
    });
  });

  signInNetworkCases.forEach((networkCase) => {
    test(networkCase.title, async ({ page, signInPage }) => {
      let intercepted = false;

      await page.route(signInRoutePattern, async (route) => {
        intercepted = true;

        if (networkCase.action === "blocked") {
          await route.abort("blockedbyclient");
          return;
        }

        if (networkCase.action === "slow-network") {
          await new Promise((resolve) => {
            setTimeout(resolve, networkCase.delayMs ?? 1200);
          });
        }

        await route.fulfill({
          status: networkCase.responseStatus ?? 500,
          contentType: "application/json",
          body: JSON.stringify(networkCase.responseBody ?? {}),
        });
      });

      const startedAt = performance.now();

      await test.step("Soumettre le formulaire de connexion", async () => {
        await signInPage.signIn(networkCase.email, networkCase.password);
      });

      await test.step("Vérifier le comportement attendu", async () => {
        expect(intercepted).toBe(true);

        if (networkCase.shouldExpectInvalidCredentialsAlert) {
          await expect(signInPage.invalidCredentialsAlert).toBeVisible();
          expect(performance.now() - startedAt).toBeGreaterThanOrEqual(1100);
          return;
        }

        await expect(page).toHaveURL(/\/sign-in$/);
      });
    });
  });
});
