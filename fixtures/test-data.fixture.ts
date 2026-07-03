import { test as base, expect } from "@playwright/test";
import { type UserCredentials, userFactory } from "@/factories/user.factory";

export type TestData = {
  user: (overrides?: Partial<UserCredentials>) => UserCredentials;
  users: (
    count: number,
    overrides?: Partial<UserCredentials>,
  ) => UserCredentials[];
};

type TestDataFixtures = {
  testData: TestData;
};

export const test = base.extend<TestDataFixtures>({
  // biome-ignore lint/correctness/noEmptyPattern: Playwright fixtures require object destructuring as first argument.
  testData: async ({}, use) => {
    await use({
      user: (overrides = {}) => userFactory.build(overrides),
      users: (count, overrides = {}) => userFactory.buildMany(count, overrides),
    });
  },
});

export { expect };
