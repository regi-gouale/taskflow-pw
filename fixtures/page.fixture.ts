import { test as base, expect } from "@playwright/test";
import { DashboardPage, SignInPage, SignUpPage } from "@/pages";

type PageFixtures = {
  dashboardPage: DashboardPage;
  signInPage: SignInPage;
  signUpPage: SignUpPage;
};

export const test = base.extend<PageFixtures>({
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
