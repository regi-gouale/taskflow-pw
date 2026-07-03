import { expect, test } from "@/fixtures/page.fixture";

test.describe("Accès direct authentifié", () => {
  test.beforeEach(async ({ authenticatedPage }) => {
    await expect(authenticatedPage).toHaveURL(/\/dashboard$/);
  });

  test.afterEach(async ({ authenticatedPage }) => {
    await authenticatedPage.context().clearCookies();
    await authenticatedPage.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test("accède au tableau de bord avec une session déjà connectée", async ({
    authenticatedUser,
    dashboardPage,
  }) => {
    await test.step("Vérifier le chargement du dashboard", async () => {
      await dashboardPage.expectLoaded();
    });

    await test.step("Vérifier l'email de l'utilisateur connecté", async () => {
      await dashboardPage.expectUserEmailVisible(authenticatedUser.email);
    });
  });
});
