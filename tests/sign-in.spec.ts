import { expect, type Page, test } from "@playwright/test";
import { type UserCredentials, userFactory } from "../factories/user.factory";

const openSignIn = async (page: Page) => {
  await page.goto("./sign-in");
  await expect(
    page.getByRole("button", { name: "Se connecter" }),
  ).toBeVisible();
  await expect(
    page.getByRole("textbox", { name: "Adresse e-mail" }),
  ).toBeVisible();
  await expect(
    page.getByRole("textbox", { name: "Mot de passe", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Se connecter" }),
  ).toBeVisible();
};

const signIn = async (page: Page, email: string, password: string) => {
  await page.getByRole("textbox", { name: "Adresse e-mail" }).fill(email);
  await page
    .getByRole("textbox", { name: "Mot de passe", exact: true })
    .fill(password);
  await page
    .getByRole("button", { name: "Se connecter" })
    .click({ force: true });
};

const createUserThroughSignUp = async (page: Page, user: UserCredentials) => {
  await page.goto("./sign-up");
  await page.getByRole("textbox", { name: "Nom" }).fill(user.fullName);
  await page.getByRole("textbox", { name: "Adresse e-mail" }).fill(user.email);
  await page
    .getByRole("textbox", { name: "Mot de passe", exact: true })
    .fill(user.password);
  await page
    .getByRole("textbox", { name: "Confirmer le mot de passe" })
    .fill(user.password);
  await page
    .getByRole("button", { name: "Créer le compte" })
    .click({ force: true });

  await expect(
    page.getByRole("listitem").filter({ hasText: "Compte créé avec succès." }),
  ).toBeVisible();
};

test.describe("Connexion", () => {
  test("connecte réellement un utilisateur existant", async ({ page }) => {
    const user = userFactory.build();

    await createUserThroughSignUp(page, user);
    await page.context().clearCookies();
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    await openSignIn(page);
    await signIn(page, user.email, user.password);

    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(
      page.getByRole("heading", { name: "Tableau de bord" }),
    ).toBeVisible();
    await expect(page.getByText(user.email)).toBeVisible();
  });

  test("affiche les champs de connexion et les liens associés", async ({
    page,
  }) => {
    await openSignIn(page);
    await expect(
      page.getByRole("link", { name: "Mot de passe oublié ?" }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Créer un compte" }),
    ).toBeVisible();
  });

  test("gère un email invalide", async ({ page }) => {
    await openSignIn(page);
    await signIn(page, "email-invalide", "azertyuiop");

    await expect(page).toHaveURL(/\/sign-in$/);
    await expect(
      page.getByRole("textbox", { name: "Adresse e-mail" }),
    ).toHaveValue("email-invalide");
  });

  test("refuse une connexion quand les champs sont vides", async ({ page }) => {
    await openSignIn(page);
    await signIn(page, "", "");

    await expect(page).toHaveURL(/\/sign-in$/);
    await expect(
      page.getByRole("textbox", { name: "Adresse e-mail" }),
    ).toHaveValue("");
  });

  test("refuse une connexion avec des identifiants inconnus", async ({
    page,
  }) => {
    const unknownUser = userFactory.build({
      email: `missing-${Date.now()}@test.com`,
      password: "wrong-password",
    });

    await openSignIn(page);
    await signIn(page, unknownUser.email, unknownUser.password);

    await expect(
      page
        .getByRole("listitem")
        .filter({ hasText: "Invalid email or password" }),
    ).toBeVisible();
    await expect(page).toHaveURL(/\/sign-in$/);
  });

  test("fournit la navigation vers la page d'inscription", async ({ page }) => {
    await openSignIn(page);
    await page.getByRole("link", { name: "Créer un compte" }).click();
    await expect(page).toHaveURL(/\/sign-up$/);
    await expect(
      page.getByText("Créer un compte", { exact: true }),
    ).toBeVisible();
  });

  test("fournit la navigation vers mot de passe oublié", async ({ page }) => {
    await openSignIn(page);
    await page.getByRole("link", { name: "Mot de passe oublié ?" }).click();
    await expect(page).toHaveURL(/\/forgot-password$/);
  });
});
