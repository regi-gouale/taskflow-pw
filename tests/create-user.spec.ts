import { expect, test } from "@playwright/test";

test("Créer un utilisateur sur TaskFlow", async ({ page }) => {
  await page.goto(`./sign-up`);

  // Remplir le formulaire d'inscription
  await page.getByRole("textbox", { name: "Nom" }).fill("Jean Martial DUPOND");
  await page.getByTestId("email-input").fill("dupond@test.com");
  await page
    .getByRole("textbox", { name: "Mot de passe", exact: true })
    .fill("azertyuiop");
  await page.getByTestId("confirm-password-input").fill("azertyuiop");
  await page.getByRole("button", { name: "Créer le compte" }).click();

  // Vérifier que l'utilisateur est redirigé vers le tableau de bord après la création du compte
  await expect(
    page.getByRole("listitem").filter({ hasText: "Compte créé avec succès." }),
  ).toBeVisible();
  // await expect(page.getByText("Compte créé avec succès.")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Tableau de bord" }),
  ).toBeVisible();
  await expect(page.getByText("Jean Martial DUPOND")).toBeVisible();
  await expect(page.getByText("dupond@test.com")).toBeVisible();
});
