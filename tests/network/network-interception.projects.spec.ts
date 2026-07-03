import { expect, test } from "@/fixtures/page.fixture";
import type { ProjectsPage } from "@/pages";

const projectRoutePattern = "**/api/v1/projects**";

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

  test("simule une erreur serveur lors de la création d'un projet", async ({
    page,
    projectsPage,
  }) => {
    const projectName = buildProjectName("network-project-server-error");
    let intercepted = false;

    await page.route(projectRoutePattern, async (route) => {
      if (route.request().method() !== "POST") {
        await route.continue();
        return;
      }

      intercepted = true;
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({
          ok: false,
          message: "Internal Server Error",
        }),
      });
    });

    await test.step("Soumettre un nouveau projet", async () => {
      await submitProject(projectsPage, projectName);
    });

    await test.step("Vérifier qu'aucun projet n'est créé", async () => {
      expect(intercepted).toBe(true);
      await expect(projectsPage.projectCard(projectName)).toHaveCount(0);
    });
  });

  test("simule un réseau lent lors de la création d'un projet", async ({
    page,
    projectsPage,
  }) => {
    const projectName = buildProjectName("network-project-slow");

    await page.route(projectRoutePattern, async (route) => {
      if (route.request().method() !== "POST") {
        await route.continue();
        return;
      }

      await new Promise((resolve) => {
        setTimeout(resolve, 1200);
      });

      await route.fallback();
    });

    const startedAt = performance.now();

    await test.step("Créer le projet via l'interface", async () => {
      await submitProject(projectsPage, projectName);
    });

    await test.step("Vérifier le délai et l'affichage du projet", async () => {
      await expect(projectsPage.projectCard(projectName)).toBeVisible();
      expect(performance.now() - startedAt).toBeGreaterThanOrEqual(1100);
    });
  });

  test("bloque la requête de création d'un projet", async ({
    page,
    projectsPage,
  }) => {
    const projectName = buildProjectName("network-project-blocked");
    let intercepted = false;

    await page.route(projectRoutePattern, async (route) => {
      if (route.request().method() !== "POST") {
        await route.continue();
        return;
      }

      intercepted = true;
      await route.abort("blockedbyclient");
    });

    await test.step("Tenter de créer le projet", async () => {
      await submitProject(projectsPage, projectName);
    });

    await test.step("Vérifier que le projet n'a pas été créé", async () => {
      expect(intercepted).toBe(true);
      await expect(projectsPage.projectCard(projectName)).toHaveCount(0);
    });
  });
});
