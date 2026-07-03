import { expect, test } from "@/fixtures/page.fixture";

const taskRoutePattern = "**/api/v1/tasks**";

const buildTaskTitle = (prefix: string): string =>
  `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

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
