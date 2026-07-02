import { expect, test } from "@/fixtures/page.fixture";

test.describe("Accès direct authentifié", () => {
  test("accède au tableau de bord avec une session déjà connectée", async ({
    authenticatedPage,
    authenticatedUser,
    dashboardPage,
  }) => {
    await expect(authenticatedPage).toHaveURL(/\/dashboard$/);
    await dashboardPage.expectLoaded();
    await dashboardPage.expectUserEmailVisible(authenticatedUser.email);
  });
});
