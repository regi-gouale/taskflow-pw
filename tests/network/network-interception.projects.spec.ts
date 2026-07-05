import { networkInterceptionFactory } from "@/factories/network-interception.factory";
import { expect, test } from "@/fixtures/page.fixture";
import type { ProjectsPage } from "@/pages";

const projectRoutePattern = "**/api/v1/projects**";

const projectCreationCases =
  networkInterceptionFactory.buildProjectCreationCases();

const buildProjectName = (prefix: string): string =>
  `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

const submitProject = async (
  projectsPage: ProjectsPage,
  name: string,
  description = "Projet de test réseau",
): Promise<void> => {
  await projectsPage.newProjectButton.click();
  await projectsPage.createProjectDialog
    .getByTestId("project-name-input")
    .fill(name);
  await projectsPage.createProjectDialog
    .getByTestId("project-description-input")
    .fill(description);
  await projectsPage.createProjectDialog.getByTestId("project-submit").click();
};

test.describe("Interceptions réseau - projets", () => {
  test.beforeEach(async ({ authenticatedPage, projectsPage }) => {
    await expect(authenticatedPage).toHaveURL(/\/dashboard$/);
    await projectsPage.goto();
    await projectsPage.expectLoaded();
  });

  test.afterEach(async ({ page }) => {
    await page.context().clearCookies();
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  for (const projectCase of projectCreationCases) {
    test(projectCase.title, async ({ page, projectsPage }) => {
      const projectName = buildProjectName(projectCase.namePrefix);
      let intercepted = false;

      await page.route(projectRoutePattern, async (route) => {
        if (route.request().method() !== "POST") {
          await route.continue();
          return;
        }

        if (projectCase.action === "server-error") {
          intercepted = true;
          await route.fulfill({
            status: 500,
            contentType: "application/json",
            body: JSON.stringify({
              ok: false,
              message: "Internal Server Error",
            }),
          });
          return;
        }

        if (projectCase.action === "slow-network") {
          await new Promise((resolve) => {
            setTimeout(resolve, projectCase.delayMs ?? 1200);
          });

          await route.fallback();
          return;
        }

        intercepted = true;
        await route.abort("blockedbyclient");
      });

      const startedAt = performance.now();

      await test.step("Soumettre un nouveau projet", async () => {
        await submitProject(projectsPage, projectName);
      });

      await test.step("Vérifier le résultat attendu", async () => {
        if (projectCase.shouldIntercept) {
          expect(intercepted).toBe(true);
        }

        if (projectCase.shouldBeCreated) {
          await expect(projectsPage.projectCard(projectName)).toBeVisible();
          expect(performance.now() - startedAt).toBeGreaterThanOrEqual(1100);
          return;
        }

        await expect(projectsPage.projectCard(projectName)).toHaveCount(0);
      });
    });
  }
});
