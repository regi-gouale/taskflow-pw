import type { APIRequestContext, APIResponse } from "@playwright/test";
import type { UserCredentials } from "@/factories/user.factory";
import { test as base, expect } from "@/fixtures/test-data.fixture";
import { createCleanupTracker } from "@/utils/test-cleanup";

type ApiFixtures = {
  signInPath: string;
  signUpPath: string;
  signIn: (credentials: UserCredentials) => Promise<APIResponse>;
  signUp: (user?: Partial<UserCredentials>) => Promise<UserCredentials>;
};

const defaultSignUpPath = "/api/auth/sign-up";
const defaultSignInPath = "/api/auth/sign-in";
const defaultSignInEmailPath = "/api/auth/sign-in/email";
const authStorageStatePath = "playwright/.auth/user.json";

const dedupe = (paths: string[]): string[] =>
  paths.filter((value, index, arr) => arr.indexOf(value) === index);

const signInWithFallback = async (
  requestContext: APIRequestContext,
  credentials: UserCredentials,
  preferredSignInPath: string,
): Promise<boolean> => {
  const candidates = dedupe([
    preferredSignInPath,
    process.env.API_SIGN_IN_PATH ?? "",
    defaultSignInPath,
    defaultSignInEmailPath,
  ]).filter(Boolean);

  for (const path of candidates) {
    const response = await requestContext.post(path, {
      data: {
        email: credentials.email,
        password: credentials.password,
      },
    });

    if (response.ok()) {
      return true;
    }
  }

  return false;
};

export const test = base.extend<ApiFixtures>({
  request: async ({ baseURL, playwright, signInPath }, use) => {
    const requestContext = await playwright.request.newContext({
      baseURL,
      storageState: authStorageStatePath,
    });

    const meResponse = await requestContext.get("/api/v1/me");
    if (meResponse.status() === 401) {
      const authenticatedUser: UserCredentials = {
        fullName: "Taskflow E2E",
        email: process.env.E2E_EMAIL ?? "test@taskflow.dev",
        password: process.env.E2E_PASSWORD ?? "Password123!",
      };

      const hasSignedIn = await signInWithFallback(
        requestContext,
        authenticatedUser,
        signInPath,
      );

      expect(hasSignedIn).toBeTruthy();
      await requestContext.storageState({ path: authStorageStatePath });
    }

    const cleanupTracker = await createCleanupTracker(
      playwright,
      baseURL,
      await requestContext.storageState(),
    );

    await use(requestContext);

    await cleanupTracker.cleanup(await requestContext.storageState());
    await requestContext.dispose();
  },
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
