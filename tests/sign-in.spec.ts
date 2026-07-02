import { expect, type Page, test } from "@playwright/test";

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

test.describe("Connexion", () => {
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
    await openSignIn(page);
    await signIn(page, `missing-${Date.now()}@test.com`, "wrong-password");

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
