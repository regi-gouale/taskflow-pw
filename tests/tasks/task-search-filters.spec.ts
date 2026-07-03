import { expect, test } from "@/fixtures/page.fixture";

const buildTaskTitle = (prefix: string): string =>
  `${prefix} ${Date.now()}-${Math.floor(Math.random() * 1000)}`;

test.describe("Gestion des tâches - Recherche et filtres", () => {
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

  test("gère la recherche et les filtres", async ({ tasksPage }) => {
    const searchableTask = buildTaskTitle("E2E search urgent task");
    const otherTask = buildTaskTitle("E2E search low task");

    await test.step("Créer deux tâches de priorités différentes", async () => {
      await tasksPage.createTask({
        title: searchableTask,
        priority: "Urgente",
      });
      await tasksPage.createTask({
        title: otherTask,
        priority: "Basse",
      });
      await tasksPage.expectTaskVisible(searchableTask);
      await tasksPage.expectTaskVisible(otherTask);
    });

    await test.step("Filtrer sur priorité Urgente", async () => {
      await tasksPage.filterByPriority("Urgente");
      await tasksPage.expectTaskVisible(searchableTask);
      await tasksPage.expectTaskNotVisible(otherTask);
      await tasksPage.clearPriorityFilter();
    });

    await test.step("Rechercher une tâche par son titre", async () => {
      await tasksPage.searchTask(searchableTask);
      await tasksPage.expectTaskVisible(searchableTask);
      await tasksPage.expectTaskNotVisible(otherTask);
      await tasksPage.clearSearch();
    });
  });
});
