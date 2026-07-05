import { taskMetadataFactory } from "@/factories/task-metadata.factory";
import { expect, test } from "@/fixtures/page.fixture";

const buildTaskTitle = (prefix: string): string =>
  `${prefix} ${Date.now()}-${Math.floor(Math.random() * 1000)}`;

const taskMetadataCases = taskMetadataFactory.buildCases();

test.describe("Gestion des tâches - Métadonnées", () => {
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

  for (const metadataCase of taskMetadataCases) {
    test(metadataCase.title, async ({ tasksPage }) => {
      const taskTitle = buildTaskTitle(metadataCase.taskTitlePrefix);

      await test.step(metadataCase.createStepTitle, async () => {
        await tasksPage.createTask({
          title: taskTitle,
          ...metadataCase.createPayload,
        });

        if (metadataCase.expectedStatusAfterCreate) {
          await tasksPage.expectTaskInStatus(
            taskTitle,
            metadataCase.expectedStatusAfterCreate,
          );
          return;
        }

        await tasksPage.expectTaskVisible(taskTitle);
      });

      await test.step(metadataCase.updateStepTitle, async () => {
        await tasksPage.updateTaskMetadata(
          taskTitle,
          metadataCase.updatePayload,
        );

        if (metadataCase.expectedStatusAfterUpdate) {
          await tasksPage.expectTaskInStatus(
            taskTitle,
            metadataCase.expectedStatusAfterUpdate,
          );
          return;
        }

        await tasksPage.expectTaskVisible(taskTitle);
      });

      if (metadataCase.verifyUrgentPriorityFilter) {
        await test.step("Vérifier le filtre sur priorité Urgente", async () => {
          await tasksPage.filterByPriority("Urgente");
          await tasksPage.expectTaskVisible(taskTitle);
          await tasksPage.clearPriorityFilter();
        });
      }
    });
  }
});
