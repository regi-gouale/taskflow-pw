import { test as base, expect, type Page } from "@playwright/test";
import { type UserCredentials, userFactory } from "@/factories/user.factory";
import { DashboardPage, SignInPage, SignUpPage } from "@/pages";

type PageFixtures = {
  authenticatedPage: Page;
  authenticatedUser: UserCredentials;
  dashboardPage: DashboardPage;
  signInPage: SignInPage;
  signUpPage: SignUpPage;
};

export const test = base.extend<PageFixtures>({
  authenticatedUser: async ({ dashboardPage, signUpPage }, use) => {
    const user = userFactory.build();

    await signUpPage.goto();
    await signUpPage.signUp(user);
    await expect(signUpPage.successAlert).toBeVisible();
    await dashboardPage.expectLoaded();
    await dashboardPage.expectUserEmailVisible(user.email);

    await use(user);
  },
  authenticatedPage: async (
    { authenticatedUser, dashboardPage, page, signInPage },
    use,
  ) => {
    await page.context().clearCookies();
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    await signInPage.goto();
    await signInPage.expectLoaded();
    await signInPage.signIn(
      authenticatedUser.email,
      authenticatedUser.password,
    );
    await dashboardPage.expectLoaded();
    await dashboardPage.expectUserEmailVisible(authenticatedUser.email);

    await use(page);
  },
  dashboardPage: async ({ page }, use) => {
    await use(new DashboardPage(page));
  },
  signInPage: async ({ page }, use) => {
    await use(new SignInPage(page));
  },
  signUpPage: async ({ page }, use) => {
    await use(new SignUpPage(page));
  },
});

export { expect };
