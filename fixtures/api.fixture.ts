import type { APIResponse } from "@playwright/test";
import type { UserCredentials } from "@/factories/user.factory";
import { test as base, expect } from "@/fixtures/test-data.fixture";

type ApiFixtures = {
  signInPath: string;
  signUpPath: string;
  signIn: (credentials: UserCredentials) => Promise<APIResponse>;
  signUp: (user?: Partial<UserCredentials>) => Promise<UserCredentials>;
};

const defaultSignUpPath = "/api/auth/sign-up";
const defaultSignInPath = "/api/auth/sign-in";

export const test = base.extend<ApiFixtures>({
  // biome-ignore lint/correctness/noEmptyPattern: Playwright fixtures require object destructuring as first argument.
  signUpPath: async ({}, use) => {
    await use(process.env.API_SIGN_UP_PATH ?? defaultSignUpPath);
  },
  // biome-ignore lint/correctness/noEmptyPattern: Playwright fixtures require object destructuring as first argument.
  signInPath: async ({}, use) => {
    await use(process.env.API_SIGN_IN_PATH ?? defaultSignInPath);
  },
  signUp: async ({ request, signUpPath, testData }, use) => {
    await use(async (overrides = {}) => {
      const user = testData.user(overrides);
      const response = await request.post(signUpPath, {
        data: {
          fullName: user.fullName,
          email: user.email,
          password: user.password,
        },
      });

      expect(response.ok()).toBeTruthy();
      return user;
    });
  },
  signIn: async ({ request, signInPath }, use) => {
    await use((credentials) =>
      request.post(signInPath, {
        data: {
          email: credentials.email,
          password: credentials.password,
        },
      }),
    );
  },
});

export { expect };
