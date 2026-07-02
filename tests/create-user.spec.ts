import { faker } from "@faker-js/faker";
import { expect, type Page, test } from "@playwright/test";

type SignUpUser = {
  fullName: string;
  email: string;
  password: string;
};

const uniqueUser = (): SignUpUser => {
  return {
    fullName: faker.person.fullName(),
    email: faker.internet.email(),
    password: "azertyuiop",
  };
};

const openSignUp = async (page: Page) => {
  await page.goto("./sign-up");
  await expect(
    page.getByText("Créer un compte", { exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Nom" })).toBeVisible();
  await expect(
    page.getByRole("textbox", { name: "Adresse e-mail" }),
  ).toBeVisible();
  await expect(
    page.getByRole("textbox", { name: "Mot de passe", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("textbox", { name: "Confirmer le mot de passe" }),
  ).toBeVisible();
};

const fillSignUpForm = async (
  page: Page,
  user: SignUpUser,
  confirmPassword = user.password,
) => {
  await page.getByRole("textbox", { name: "Nom" }).fill(user.fullName);
  await page.getByRole("textbox", { name: "Adresse e-mail" }).fill(user.email);
  await page
    .getByRole("textbox", { name: "Mot de passe", exact: true })
    .fill(user.password);
  await page
    .getByRole("textbox", { name: "Confirmer le mot de passe" })
    .fill(confirmPassword);
};

const submitSignUp = async (page: Page) => {
  await page
    .getByRole("button", { name: "Créer le compte" })
    .click({ force: true });
};

test.describe("Inscription", () => {
  test("crée réellement un utilisateur unique", async ({ page }) => {
    const user = uniqueUser();

    await openSignUp(page);
    await fillSignUpForm(page, user);
    await submitSignUp(page);

    await expect(
      page
        .getByRole("listitem")
        .filter({ hasText: "Compte créé avec succès." }),
    ).toBeVisible();
    await expect(page).not.toHaveURL(/\/sign-up$/);
    await expect(page.getByText(user.email)).toBeVisible();
  });

  test("affiche les champs attendus et le texte d'aide", async ({ page }) => {
    const user = uniqueUser();

    await openSignUp(page);
    await fillSignUpForm(page, user);

    await expect(page.getByText("Au moins 8 caractères.")).toBeVisible();
    await expect(page.getByRole("textbox", { name: "Nom" })).toHaveValue(
      user.fullName,
    );
    await expect(
      page.getByRole("textbox", { name: "Adresse e-mail" }),
    ).toHaveValue(user.email);
  });

  test("refuse une inscription si les mots de passe ne correspondent pas", async ({
    page,
  }) => {
    const user = uniqueUser();

    await openSignUp(page);
    await fillSignUpForm(page, user, "different-password");
    await submitSignUp(page);

    await expect(
      page
        .getByRole("listitem")
        .filter({ hasText: "Les mots de passe ne correspondent pas." }),
    ).toBeVisible();
    await expect(page).toHaveURL(/\/sign-up$/);
  });

  test("reste sur la page d'inscription si le formulaire est vide", async ({
    page,
  }) => {
    const user = uniqueUser();

    await openSignUp(page);
    await fillSignUpForm(page, {
      ...user,
      fullName: "",
      email: "",
      password: "",
    });
    await submitSignUp(page);

    await expect(page).toHaveURL(/\/sign-up$/);
    await expect(page.getByRole("textbox", { name: "Nom" })).toHaveValue("");
    await expect(
      page.getByRole("textbox", { name: "Adresse e-mail" }),
    ).toHaveValue("");
  });

  test("fournit la navigation vers la page de connexion", async ({ page }) => {
    await openSignUp(page);
    await page.getByRole("link", { name: "Se connecter" }).click();
    await expect(page).toHaveURL(/\/sign-in$/);
    await expect(
      page.getByRole("textbox", { name: "Adresse e-mail" }),
    ).toBeVisible();
    await expect(
      page.getByRole("textbox", { name: "Mot de passe", exact: true }),
    ).toBeVisible();
  });
});
