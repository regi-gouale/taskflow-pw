import { expect, type Locator, type Page } from "@playwright/test";

export class SignInPage {
  constructor(private readonly page: Page) {}

  get emailInput(): Locator {
    return this.page.getByRole("textbox", { name: "Adresse e-mail" });
  }

  get passwordInput(): Locator {
    return this.page.getByRole("textbox", {
      name: "Mot de passe",
      exact: true,
    });
  }

  get submitButton(): Locator {
    return this.page.getByRole("button", { name: "Se connecter" });
  }

  get forgotPasswordLink(): Locator {
    return this.page.getByRole("link", { name: "Mot de passe oublié ?" });
  }

  get createAccountLink(): Locator {
    return this.page.getByRole("link", { name: "Créer un compte" });
  }

  get invalidCredentialsAlert(): Locator {
    return this.page
      .getByRole("listitem")
      .filter({
        hasText: /Invalid email or password|Impossible de se connecter\./,
      });
  }

  async goto(): Promise<void> {
    await this.page.goto("./sign-in");
  }

  async expectLoaded(): Promise<void> {
    await expect(this.submitButton).toBeVisible();
    await expect(this.emailInput).toBeVisible();
    await expect(this.passwordInput).toBeVisible();
  }

  async fillCredentials(email: string, password: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
  }

  async submit(): Promise<void> {
    await this.submitButton.click({ force: true });
  }

  async signIn(email: string, password: string): Promise<void> {
    await this.fillCredentials(email, password);
    await this.submit();
  }

  async goToSignUp(): Promise<void> {
    await this.createAccountLink.click();
  }

  async goToForgotPassword(): Promise<void> {
    await this.forgotPasswordLink.click();
  }
}
