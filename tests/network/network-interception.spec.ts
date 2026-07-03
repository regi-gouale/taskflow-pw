import type { Page } from "@playwright/test";
import { expect, test } from "@/fixtures/page.fixture";
import type { ProjectsPage } from "@/pages";

type FetchResult = {
  ok: boolean;
  status: number;
  text: string;
};

const mockEndpoint = "/api/network-mocks/sign-in";
const taskRoutePattern = "**/api/v1/tasks**";
const projectRoutePattern = "**/api/v1/projects**";

const buildTaskTitle = (prefix: string): string =>
  `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

const fetchMockedEndpoint = async (page: Page): Promise<FetchResult> => {
  return page.evaluate(async (endpoint) => {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({ email: "test@taskflow.dev" }),
    });

    return {
      ok: response.ok,
      status: response.status,
      text: await response.text(),
    };
  }, mockEndpoint);
};

test.use({ storageState: { cookies: [], origins: [] } });

test.describe("Interceptions réseau", () => {
  test.beforeEach(async ({ signInPage }) => {
    await signInPage.goto();
    await signInPage.expectLoaded();
  });

  test.afterEach(async ({ page }) => {
    await page.context().clearCookies();
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test("simule une erreur serveur avec un mock de réponse", async ({
    page,
  }) => {
    await page.route(`**${mockEndpoint}`, async (route) => {
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({
          ok: false,
          message: "Internal Server Error",
        }),
      });
    });

    const response = await fetchMockedEndpoint(page);

    await test.step("Verifier la reponse mockee", async () => {
      expect(response.status).toBe(500);
      expect(response.ok).toBe(false);
      expect(JSON.parse(response.text)).toEqual({
        ok: false,
        message: "Internal Server Error",
      });
    });
  });

  test("simule un reseau lent avant de renvoyer la reponse", async ({
    page,
  }) => {
    await page.route(`**${mockEndpoint}`, async (route) => {
      await new Promise((resolve) => {
        setTimeout(resolve, 1200);
      });

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          ok: true,
        }),
      });
    });

    const elapsed = await page.evaluate(async (endpoint) => {
      const startedAt = performance.now();

      await fetch(endpoint, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ email: "slow@test.com" }),
      });

      return performance.now() - startedAt;
    }, mockEndpoint);

    await test.step("Verifier que l'appel a ete retarde", async () => {
      expect(elapsed).toBeGreaterThanOrEqual(1100);
    });
  });

  test("bloque une requete avec abort", async ({ page }) => {
    let intercepted = false;

    await page.route(`**${mockEndpoint}`, async (route) => {
      intercepted = true;
      await route.abort("blockedbyclient");
    });

    const failure = await page.evaluate(async (endpoint) => {
      try {
        await fetch(endpoint, {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({ email: "blocked@test.com" }),
        });

        return null;
      } catch (error) {
        if (error instanceof Error) {
          return {
            name: error.name,
            message: error.message,
          };
        }

        return {
          name: "UnknownError",
          message: String(error),
        };
      }
    }, mockEndpoint);

    await test.step("Verifier que la requete a bien ete interceptee", async () => {
      expect(intercepted).toBe(true);
      expect(failure).not.toBeNull();
      expect(failure?.name).toBe("TypeError");
    });
  });
});

test.describe("Interceptions réseau - tâches", () => {
  test.beforeEach(async ({ authenticatedPage, tasksPage }) => {
    await expect(authenticatedPage).toHaveURL(/\/dashboard$/);
    await tasksPage.goto();
    await tasksPage.expectLoaded();
  });

  test.afterEach(async ({ page }) => {
    await page.context().clearCookies();
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test("simule une erreur serveur lors de la création d'une tâche", async ({
    page,
    tasksPage,
  }) => {
    const taskTitle = buildTaskTitle("network-task-server-error");
    let intercepted = false;

    await page.route(taskRoutePattern, async (route) => {
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

    await test.step("Soumettre une nouvelle tâche", async () => {
      await tasksPage.newTaskButton.click();
      await expect(tasksPage.createTaskDialog).toBeVisible();
      await tasksPage.createTaskTitleInput.fill(taskTitle);
      await tasksPage.createTaskDialog.getByTestId("task-submit").click();
    });

    await test.step("Vérifier qu'aucune tâche n'est créée", async () => {
      expect(intercepted).toBe(true);
      await expect(tasksPage.taskCard(taskTitle)).toHaveCount(0);
    });
  });

  test("simule un réseau lent lors de la création d'une tâche", async ({
    page,
    tasksPage,
  }) => {
    const taskTitle = buildTaskTitle("network-task-slow");

    await page.route(taskRoutePattern, async (route) => {
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

    await test.step("Créer la tâche via l'interface", async () => {
      await tasksPage.newTaskButton.click();
      await expect(tasksPage.createTaskDialog).toBeVisible();
      await tasksPage.createTaskTitleInput.fill(taskTitle);
      await tasksPage.createTaskDialog.getByTestId("task-submit").click();
    });

    await test.step("Vérifier le délai et la visibilité de la tâche", async () => {
      await expect(tasksPage.taskCard(taskTitle)).toBeVisible();
      expect(performance.now() - startedAt).toBeGreaterThanOrEqual(1100);
    });
  });

  test("bloque la requête de création d'une tâche", async ({
    page,
    tasksPage,
  }) => {
    const taskTitle = buildTaskTitle("network-task-blocked");
    let intercepted = false;

    await page.route(taskRoutePattern, async (route) => {
      if (route.request().method() !== "POST") {
        await route.continue();
        return;
      }

      intercepted = true;
      await route.abort("blockedbyclient");
    });

    await test.step("Tenter de créer la tâche", async () => {
      await tasksPage.newTaskButton.click();
      await expect(tasksPage.createTaskDialog).toBeVisible();
      await tasksPage.createTaskTitleInput.fill(taskTitle);
      await tasksPage.createTaskDialog.getByTestId("task-submit").click();
    });

    await test.step("Vérifier que la tâche n'a pas été créée", async () => {
      expect(intercepted).toBe(true);
      await expect(tasksPage.taskCard(taskTitle)).toHaveCount(0);
    });
  });
});

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
    const projectName = buildTaskTitle("network-project-server-error");
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
    const projectName = buildTaskTitle("network-project-slow");

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
    const projectName = buildTaskTitle("network-project-blocked");
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
