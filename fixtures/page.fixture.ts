import type { Page } from "@playwright/test";
import type { UserCredentials } from "@/factories/user.factory";
import { test as base, expect } from "@/fixtures/test-data.fixture";
import { DashboardPage, SignInPage, SignUpPage, TasksPage } from "@/pages";

type PageFixtures = {
  authenticatedPage: Page;
  authenticatedUser: UserCredentials;
  dashboardPage: DashboardPage;
  signInPage: SignInPage;
  signUpPage: SignUpPage;
  tasksPage: TasksPage;
};

export const test = base.extend<PageFixtures>({
  authenticatedUser: async ({ dashboardPage, signUpPage, testData }, use) => {
    const user = testData.user();

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
  tasksPage: async ({ page }, use) => {
    await use(new TasksPage(page));
  },
});

export { expect };
