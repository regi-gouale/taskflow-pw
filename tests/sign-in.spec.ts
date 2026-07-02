import { expect, test } from "@/fixtures/page.fixture";

test.describe("Connexion", () => {
  test("connecte réellement un utilisateur existant", async ({
    page,
    testData,
    signInPage,
    signUpPage,
    dashboardPage,
  }) => {
    const user = testData.user();

    await signUpPage.goto();
    await signUpPage.signUp(user);
    await expect(signUpPage.successAlert).toBeVisible();

    await page.context().clearCookies();
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    await signInPage.goto();
    await signInPage.expectLoaded();
    await signInPage.signIn(user.email, user.password);

    await dashboardPage.expectLoaded();
    await dashboardPage.expectUserEmailVisible(user.email);
  });

  test("affiche les champs de connexion et les liens associés", async ({
    signInPage,
  }) => {
    await signInPage.goto();
    await signInPage.expectLoaded();
    await expect(signInPage.forgotPasswordLink).toBeVisible();
    await expect(signInPage.createAccountLink).toBeVisible();
  });

  test("gère un email invalide", async ({ page, signInPage }) => {
    await signInPage.goto();
    await signInPage.expectLoaded();
    await signInPage.signIn("email-invalide", "azertyuiop");

    await expect(page).toHaveURL(/\/sign-in$/);
    await expect(signInPage.emailInput).toHaveValue("email-invalide");
  });

  test("refuse une connexion quand les champs sont vides", async ({
    page,
    signInPage,
  }) => {
    await signInPage.goto();
    await signInPage.expectLoaded();
    await signInPage.signIn("", "");

    await expect(page).toHaveURL(/\/sign-in$/);
    await expect(signInPage.emailInput).toHaveValue("");
  });

  test("refuse une connexion avec des identifiants inconnus", async ({
    page,
    testData,
    signInPage,
  }) => {
    const unknownUser = testData.user({
      email: `missing-${Date.now()}@test.com`,
      password: "wrong-password",
    });

    await signInPage.goto();
    await signInPage.expectLoaded();
    await signInPage.signIn(unknownUser.email, unknownUser.password);

    await expect(signInPage.invalidCredentialsAlert).toBeVisible();
    await expect(page).toHaveURL(/\/sign-in$/);
  });

  test("fournit la navigation vers la page d'inscription", async ({
    page,
    signInPage,
  }) => {
    await signInPage.goto();
    await signInPage.expectLoaded();
    await signInPage.goToSignUp();

    await expect(page).toHaveURL(/\/sign-up$/);
    await expect(
      page.getByText("Créer un compte", { exact: true }),
    ).toBeVisible();
  });

  test("fournit la navigation vers mot de passe oublié", async ({
    page,
    signInPage,
  }) => {
    await signInPage.goto();
    await signInPage.expectLoaded();
    await signInPage.goToForgotPassword();

    await expect(page).toHaveURL(/\/forgot-password$/);
  });
});
