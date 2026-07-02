import { expect, type Locator, type Page } from "@playwright/test";
import type { UserCredentials } from "../factories/user.factory";

export class SignUpPage {
  constructor(private readonly page: Page) {}

  get title(): Locator {
    return this.page.getByText("Créer un compte", { exact: true });
  }

  get fullNameInput(): Locator {
    return this.page.getByRole("textbox", { name: "Nom" });
  }

  get emailInput(): Locator {
    return this.page.getByRole("textbox", { name: "Adresse e-mail" });
  }

  get passwordInput(): Locator {
    return this.page.getByRole("textbox", {
      name: "Mot de passe",
      exact: true,
    });
  }

  get confirmPasswordInput(): Locator {
    return this.page.getByRole("textbox", {
      name: "Confirmer le mot de passe",
    });
  }

  get submitButton(): Locator {
    return this.page.getByRole("button", { name: "Créer le compte" });
  }

  get signInLink(): Locator {
    return this.page.getByRole("link", { name: "Se connecter" });
  }

  get successAlert(): Locator {
    return this.page
      .getByRole("listitem")
      .filter({ hasText: "Compte créé avec succès." });
  }

  get passwordMismatchAlert(): Locator {
    return this.page
      .getByRole("listitem")
      .filter({ hasText: "Les mots de passe ne correspondent pas." });
  }

  get passwordHint(): Locator {
    return this.page.getByText("Au moins 8 caractères.");
  }

  async goto(): Promise<void> {
    await this.page.goto("./sign-up");
  }

  async expectLoaded(): Promise<void> {
    await expect(this.title).toBeVisible();
    await expect(this.fullNameInput).toBeVisible();
    await expect(this.emailInput).toBeVisible();
    await expect(this.passwordInput).toBeVisible();
    await expect(this.confirmPasswordInput).toBeVisible();
  }

  async fillForm(
    user: UserCredentials,
    confirmPassword = user.password,
  ): Promise<void> {
    await this.fullNameInput.fill(user.fullName);
    await this.emailInput.fill(user.email);
    await this.passwordInput.fill(user.password);
    await this.confirmPasswordInput.fill(confirmPassword);
  }

  async submit(): Promise<void> {
    await this.submitButton.click({ force: true });
  }

  async signUp(
    user: UserCredentials,
    confirmPassword = user.password,
  ): Promise<void> {
    await this.fillForm(user, confirmPassword);
    await this.submit();
  }

  async goToSignIn(): Promise<void> {
    await this.signInLink.click();
  }
}
