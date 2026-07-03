import { expect, test } from "@/fixtures/page.fixture";

test.use({ storageState: { cookies: [], origins: [] } });

test.describe("Inscription", () => {
  test.beforeEach(async ({ signUpPage }) => {
    await signUpPage.goto();
    await signUpPage.expectLoaded();
  });

  test.afterEach(async ({ page }) => {
    await page.context().clearCookies();
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test("crée réellement un utilisateur unique", async ({
    page,
    testData,
    signUpPage,
  }) => {
    const user = await test.step("Préparer un utilisateur unique", async () =>
      testData.user());

    await test.step("Soumettre le formulaire d'inscription", async () => {
      await signUpPage.signUp(user);
    });

    await test.step("Vérifier la création du compte", async () => {
      await expect(signUpPage.successAlert).toBeVisible();
      await expect(page).not.toHaveURL(/\/sign-up$/);
      await expect(page.getByText(user.email)).toBeVisible();
    });
  });

  test("affiche les champs attendus et le texte d'aide", async ({
    testData,
    signUpPage,
  }) => {
    const user =
      await test.step("Préparer des données de formulaire", async () =>
        testData.user());

    await test.step("Renseigner le formulaire", async () => {
      await signUpPage.fillForm(user);
    });

    await test.step("Vérifier les champs et le texte d'aide", async () => {
      await expect(signUpPage.passwordHint).toBeVisible();
      await expect(signUpPage.fullNameInput).toHaveValue(user.fullName);
      await expect(signUpPage.emailInput).toHaveValue(user.email);
    });
  });

  test("refuse une inscription si les mots de passe ne correspondent pas", async ({
    page,
    testData,
    signUpPage,
  }) => {
    const user =
      await test.step("Préparer un utilisateur avec mot de passe de confirmation différent", async () =>
        testData.user());

    await test.step("Soumettre le formulaire avec mismatch", async () => {
      await signUpPage.signUp(user, "different-password");
    });

    await test.step("Vérifier l'erreur de confirmation", async () => {
      await expect(signUpPage.passwordMismatchAlert).toBeVisible();
      await expect(page).toHaveURL(/\/sign-up$/);
    });
  });

  test("reste sur la page d'inscription si le formulaire est vide", async ({
    page,
    testData,
    signUpPage,
  }) => {
    const user = await test.step("Préparer un utilisateur de base", async () =>
      testData.user());

    await test.step("Soumettre le formulaire vide", async () => {
      await signUpPage.fillForm({
        ...user,
        fullName: "",
        email: "",
        password: "",
      });
      await signUpPage.submit();
    });

    await test.step("Vérifier qu'aucune inscription n'est effectuée", async () => {
      await expect(page).toHaveURL(/\/sign-up$/);
      await expect(signUpPage.fullNameInput).toHaveValue("");
      await expect(signUpPage.emailInput).toHaveValue("");
    });
  });

  test("fournit la navigation vers la page de connexion", async ({
    page,
    signInPage,
    signUpPage,
  }) => {
    await test.step("Cliquer sur le lien de connexion", async () => {
      await signUpPage.goToSignIn();
    });

    await test.step("Vérifier la page de connexion", async () => {
      await expect(page).toHaveURL(/\/sign-in$/);
      await signInPage.expectLoaded();
    });
  });
});
