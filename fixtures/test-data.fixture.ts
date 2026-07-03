import { test as base, expect } from "@playwright/test";
import * as allure from "allure-js-commons/sync";
import {
  type TeamMemberData,
  teamMemberFactory,
} from "@/factories/team-member.factory";
import { type UserCredentials, userFactory } from "@/factories/user.factory";

export type TestData = {
  user: (overrides?: Partial<UserCredentials>) => UserCredentials;
  users: (
    count: number,
    overrides?: Partial<UserCredentials>,
  ) => UserCredentials[];
  teamMember: (overrides?: Partial<TeamMemberData>) => TeamMemberData;
  teamMembers: (
    count: number,
    overrides?: Partial<TeamMemberData>,
  ) => TeamMemberData[];
};

type TestDataFixtures = {
  testRunStartTime: unknown;
  testData: TestData;
};

export const test = base.extend<TestDataFixtures>({
  testRunStartTime: [
    // biome-ignore lint/correctness/noEmptyPattern: Playwright fixtures require an empty destructuring pattern here.
    async ({}, use: () => Promise<void>) => {
      allure.parameter(
        "Heure de début",
        new Date().toLocaleString("fr-FR", {
          dateStyle: "medium",
          timeStyle: "medium",
        }),
      );

      await use();
    },
    { auto: true },
  ],
  // biome-ignore lint/correctness/noEmptyPattern: Playwright fixtures require object destructuring as first argument.
  testData: async ({}, use) => {
    await use({
      user: (overrides = {}) => userFactory.build(overrides),
      users: (count, overrides = {}) => userFactory.buildMany(count, overrides),
      teamMember: (overrides = {}) => teamMemberFactory.build(overrides),
      teamMembers: (count, overrides = {}) =>
        teamMemberFactory.buildMany(count, overrides),
    });
  },
});

export { expect };
