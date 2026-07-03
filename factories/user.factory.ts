import { faker } from "@faker-js/faker";

import type { TestDataFactory } from "@/factories/test-data.factory";

export interface UserCredentials {
  fullName: string;
  email: string;
  password: string;
}

export class UserFactory implements TestDataFactory<UserCredentials> {
  build(overrides: Partial<UserCredentials> = {}): UserCredentials {
    const defaultUser: UserCredentials = {
      fullName: faker.person.fullName(),
      email: faker.internet.email(),
      password: "azertyuiop",
    };

    return {
      ...defaultUser,
      ...overrides,
    };
  }

  buildMany(
    count: number,
    overrides: Partial<UserCredentials> = {},
  ): UserCredentials[] {
    return Array.from({ length: count }, () => this.build(overrides));
  }
}

export const userFactory = new UserFactory();
