import { userFactory } from "@/factories/user.factory";
import { expect, test } from "@/fixtures/page.fixture";

test.describe("Inscription", () => {
  test("crée réellement un utilisateur unique", async ({
    page,
    signUpPage,
  }) => {
    const user = userFactory.build();

    await signUpPage.goto();
    await signUpPage.expectLoaded();
    await signUpPage.signUp(user);

    await expect(signUpPage.successAlert).toBeVisible();
    await expect(page).not.toHaveURL(/\/sign-up$/);
    await expect(page.getByText(user.email)).toBeVisible();
  });

  test("affiche les champs attendus et le texte d'aide", async ({
    signUpPage,
  }) => {
    const user = userFactory.build();

    await signUpPage.goto();
    await signUpPage.expectLoaded();
    await signUpPage.fillForm(user);

    await expect(signUpPage.passwordHint).toBeVisible();
    await expect(signUpPage.fullNameInput).toHaveValue(user.fullName);
    await expect(signUpPage.emailInput).toHaveValue(user.email);
  });

  test("refuse une inscription si les mots de passe ne correspondent pas", async ({
    page,
    signUpPage,
  }) => {
    const user = userFactory.build();

    await signUpPage.goto();
    await signUpPage.expectLoaded();
    await signUpPage.signUp(user, "different-password");

    await expect(signUpPage.passwordMismatchAlert).toBeVisible();
    await expect(page).toHaveURL(/\/sign-up$/);
  });

  test("reste sur la page d'inscription si le formulaire est vide", async ({
    page,
    signUpPage,
  }) => {
    const user = userFactory.build();

    await signUpPage.goto();
    await signUpPage.expectLoaded();
    await signUpPage.fillForm({
      ...user,
      fullName: "",
      email: "",
      password: "",
    });
    await signUpPage.submit();

    await expect(page).toHaveURL(/\/sign-up$/);
    await expect(signUpPage.fullNameInput).toHaveValue("");
    await expect(signUpPage.emailInput).toHaveValue("");
  });

  test("fournit la navigation vers la page de connexion", async ({
    page,
    signInPage,
    signUpPage,
  }) => {
    await signUpPage.goto();
    await signUpPage.expectLoaded();
    await signUpPage.goToSignIn();

    await expect(page).toHaveURL(/\/sign-in$/);
    await signInPage.expectLoaded();
  });
});
