import { expect, test } from "@playwright/test";
import { userFactory } from "../factories/user.factory";
import { DashboardPage, SignInPage, SignUpPage } from "../pages";

test.describe("Connexion", () => {
  test("connecte réellement un utilisateur existant", async ({ page }) => {
    const user = userFactory.build();
    const signInPage = new SignInPage(page);
    const signUpPage = new SignUpPage(page);
    const dashboardPage = new DashboardPage(page);

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
    page,
  }) => {
    const signInPage = new SignInPage(page);

    await signInPage.goto();
    await signInPage.expectLoaded();
    await expect(signInPage.forgotPasswordLink).toBeVisible();
    await expect(signInPage.createAccountLink).toBeVisible();
  });

  test("gère un email invalide", async ({ page }) => {
    const signInPage = new SignInPage(page);

    await signInPage.goto();
    await signInPage.expectLoaded();
    await signInPage.signIn("email-invalide", "azertyuiop");

    await expect(page).toHaveURL(/\/sign-in$/);
    await expect(signInPage.emailInput).toHaveValue("email-invalide");
  });

  test("refuse une connexion quand les champs sont vides", async ({ page }) => {
    const signInPage = new SignInPage(page);

    await signInPage.goto();
    await signInPage.expectLoaded();
    await signInPage.signIn("", "");

    await expect(page).toHaveURL(/\/sign-in$/);
    await expect(signInPage.emailInput).toHaveValue("");
  });

  test("refuse une connexion avec des identifiants inconnus", async ({
    page,
  }) => {
    const signInPage = new SignInPage(page);
    const unknownUser = userFactory.build({
      email: `missing-${Date.now()}@test.com`,
      password: "wrong-password",
    });

    await signInPage.goto();
    await signInPage.expectLoaded();
    await signInPage.signIn(unknownUser.email, unknownUser.password);

    await expect(signInPage.invalidCredentialsAlert).toBeVisible();
    await expect(page).toHaveURL(/\/sign-in$/);
  });

  test("fournit la navigation vers la page d'inscription", async ({ page }) => {
    const signInPage = new SignInPage(page);

    await signInPage.goto();
    await signInPage.expectLoaded();
    await signInPage.goToSignUp();

    await expect(page).toHaveURL(/\/sign-up$/);
    await expect(
      page.getByText("Créer un compte", { exact: true }),
    ).toBeVisible();
  });

  test("fournit la navigation vers mot de passe oublié", async ({ page }) => {
    const signInPage = new SignInPage(page);

    await signInPage.goto();
    await signInPage.expectLoaded();
    await signInPage.goToForgotPassword();

    await expect(page).toHaveURL(/\/forgot-password$/);
  });
});
