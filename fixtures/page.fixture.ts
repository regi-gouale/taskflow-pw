import type { Page } from "@playwright/test";
import type { UserCredentials } from "@/factories/user.factory";
import { test as base, expect } from "@/fixtures/test-data.fixture";
import {
  DashboardPage,
  ProjectsPage,
  SignInPage,
  SignUpPage,
  TasksPage,
} from "@/pages";

type PageFixtures = {
  authenticatedPage: Page;
  authenticatedUser: UserCredentials;
  dashboardPage: DashboardPage;
  projectsPage: ProjectsPage;
  signInPage: SignInPage;
  signUpPage: SignUpPage;
  tasksPage: TasksPage;
};

const authStorageStatePath = "playwright/.auth/user.json";

function isRedirectedToSignIn(url: string): boolean {
  return /\/sign-in(?:[/?#]|$)/.test(url);
}

const authenticatedUser: UserCredentials = {
  fullName: "Taskflow E2E",
  email: process.env.E2E_EMAIL ?? "test@taskflow.dev",
  password: process.env.E2E_PASSWORD ?? "Password123!",
};

export const test = base.extend<PageFixtures>({
  // biome-ignore lint/correctness/noEmptyPattern: Playwright fixtures require object destructuring as first argument.
  authenticatedUser: async ({}, use) => {
    await use(authenticatedUser);
  },
  authenticatedPage: async (
    { authenticatedUser, dashboardPage, page, signInPage },
    use,
  ) => {
    await page.goto("/dashboard");

    if (isRedirectedToSignIn(page.url())) {
      await signInPage.expectLoaded();
      await signInPage.signIn(
        authenticatedUser.email,
        authenticatedUser.password,
      );
      await dashboardPage.expectLoaded();

      // Refresh persisted auth state so the next tests reuse a valid session.
      await page.context().storageState({ path: authStorageStatePath });
    }

    await dashboardPage.expectLoaded();
    await dashboardPage.expectUserEmailVisible(authenticatedUser.email);

    await use(page);
  },
  dashboardPage: async ({ page }, use) => {
    await use(new DashboardPage(page));
  },
  projectsPage: async ({ page }, use) => {
    await use(new ProjectsPage(page));
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
