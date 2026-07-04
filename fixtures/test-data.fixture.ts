import { test as base, expect } from "@playwright/test";
import * as allure from "allure-js-commons/sync";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
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
  testEnvironment: unknown;
  testData: TestData;
};

type DomainInfo = { feature: string; tags: string[] };

const domainFromPath = (filePath: string): DomainInfo => {
  if (filePath.includes("/auth/"))
    return { feature: "Authentification", tags: ["Auth"] };
  if (filePath.includes("/tasks/"))
    return { feature: "Tâches", tags: ["Tasks"] };
  if (filePath.includes("/projects/"))
    return { feature: "Projets", tags: ["Projects"] };
  if (filePath.includes("/team/")) return { feature: "Équipe", tags: ["Team"] };
  if (filePath.includes("/api/")) return { feature: "API", tags: ["API"] };
  if (filePath.includes("/network/"))
    return { feature: "Réseau", tags: ["Network"] };
  return { feature: "Général", tags: [] };
};

const formatPlatform = (platform: string): string =>
  (
    ({ darwin: "macOS", linux: "Linux", win32: "Windows" }) as Record<
      string,
      string
    >
  )[platform] ?? platform;

export const test = base.extend<TestDataFixtures>({
  testRunStartTime: [
    // biome-ignore lint/correctness/noEmptyPattern: Playwright fixtures require an empty destructuring pattern here.
    async ({}, use: () => Promise<void>) => {
      allure.parameter(
        "Heure de début",
        format(new Date(), "Pp", {
          locale: fr,
        }),
      );

      await use();
    },
    { auto: true },
  ],
  testEnvironment: [
    // biome-ignore lint/correctness/noEmptyPattern: Playwright fixtures require an empty destructuring pattern here.
    async ({}, use, testInfo) => {
      const baseURL =
        testInfo.project.use.baseURL ??
        process.env.APP_BASE_URL ??
        "http://localhost:3000";
      const domain = domainFromPath(testInfo.file);

      allure.epic("Taskflow");
      allure.feature(domain.feature);
      allure.tag(...domain.tags);

      allure.parameter("URL de base", baseURL, { excluded: true });
      allure.parameter("Projet", testInfo.project.name, { excluded: true });
      allure.parameter("OS", formatPlatform(process.platform), {
        excluded: true,
      });
      allure.parameter("Node.js", process.version, { excluded: true });

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
