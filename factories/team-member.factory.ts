import { faker } from "@faker-js/faker";

import type { TestDataFactory } from "@/factories/test-data.factory";

export interface TeamMemberData {
  name: string;
  email: string;
  role: string;
}

const defaultRoles = [
  "QA Engineer",
  "Product Designer",
  "Frontend Developer",
  "Backend Developer",
  "Project Manager",
];

export class TeamMemberFactory implements TestDataFactory<TeamMemberData> {
  build(overrides: Partial<TeamMemberData> = {}): TeamMemberData {
    const uniqueSuffix = `${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const defaultMember: TeamMemberData = {
      name: `E2E member ${uniqueSuffix}`,
      email: faker.internet
        .email({
          firstName: "e2e",
          lastName: `team${uniqueSuffix.replace(/[^a-zA-Z0-9]/g, "")}`,
          provider: "example.dev",
        })
        .toLowerCase(),
      role: faker.helpers.arrayElement(defaultRoles),
    };

    return {
      ...defaultMember,
      ...overrides,
    };
  }

  buildMany(
    count: number,
    overrides: Partial<TeamMemberData> = {},
  ): TeamMemberData[] {
    return Array.from({ length: count }, () => this.build(overrides));
  }
}

export const teamMemberFactory = new TeamMemberFactory();
