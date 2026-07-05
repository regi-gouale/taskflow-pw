import { networkInterceptionFactory } from "@/factories/network-interception.factory";
import { expect, test } from "@/fixtures/page.fixture";

const taskRoutePattern = "**/api/v1/tasks**";

const taskCreationCases = networkInterceptionFactory.buildTaskCreationCases();

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

  for (const taskCase of taskCreationCases) {
    test(taskCase.title, async ({ page, tasksPage }) => {
      const taskTitle = buildTaskTitle(taskCase.namePrefix);
      let intercepted = false;

      await page.route(taskRoutePattern, async (route) => {
        if (route.request().method() !== "POST") {
          await route.continue();
          return;
        }

        if (taskCase.action === "server-error") {
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

        if (taskCase.action === "slow-network") {
          await new Promise((resolve) => {
            setTimeout(resolve, taskCase.delayMs ?? 1200);
          });

          await route.fallback();
          return;
        }

        intercepted = true;
        await route.abort("blockedbyclient");
      });

      const startedAt = performance.now();

      await test.step("Soumettre une nouvelle tâche", async () => {
        await tasksPage.newTaskButton.click();
        await expect(tasksPage.createTaskDialog).toBeVisible();
        await tasksPage.createTaskTitleInput.fill(taskTitle);
        await tasksPage.createTaskDialog.getByTestId("task-submit").click();
      });

      await test.step("Vérifier le résultat attendu", async () => {
        if (taskCase.shouldIntercept) {
          expect(intercepted).toBe(true);
        }

        if (taskCase.shouldBeCreated) {
          await expect(tasksPage.taskCard(taskTitle)).toBeVisible();
          expect(performance.now() - startedAt).toBeGreaterThanOrEqual(1100);
          return;
        }

        await expect(tasksPage.taskCard(taskTitle)).toHaveCount(0);
      });
    });
  }
});
