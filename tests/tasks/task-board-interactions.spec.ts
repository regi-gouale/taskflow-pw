import { expect, test } from "@/fixtures/page.fixture";

const buildTaskTitle = (prefix: string): string =>
  `${prefix} ${Date.now()}-${Math.floor(Math.random() * 1000)}`;

test.describe("Gestion des tâches - Tableau", () => {
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

  test("glisser-déposer une tâche entre statuts", async ({ tasksPage }) => {
    const taskTitle = buildTaskTitle("E2E drag task");

    await test.step("Créer la tâche dans À faire", async () => {
      await tasksPage.createTask({ title: taskTitle, status: "À faire" });
      await tasksPage.expectTaskVisible(taskTitle);
      await tasksPage.expectTaskInStatus(taskTitle, "À faire");
    });

    await test.step("Déplacer vers En cours", async () => {
      await tasksPage.switchToBoardView();
      await tasksPage.dragTaskToStatus(taskTitle, "En cours");
      await tasksPage.expectTaskInStatus(taskTitle, "En cours");
    });
  });

  test("bascule entre les vues liste et tableau", async ({ tasksPage }) => {
    await test.step("Passer en vue liste", async () => {
      await tasksPage.switchToListView();
    });

    await test.step("Revenir en vue tableau", async () => {
      await tasksPage.switchToBoardView();
      await tasksPage.expectLoaded();
    });
  });
});
