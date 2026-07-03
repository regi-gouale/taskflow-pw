import { expect, test } from "@/fixtures/page.fixture";

const buildTaskTitle = (prefix: string): string =>
  `${prefix} ${Date.now()}-${Math.floor(Math.random() * 1000)}`;

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

  test("définit puis modifie le statut d'une tâche", async ({ tasksPage }) => {
    const taskTitle = buildTaskTitle("E2E status task");

    await test.step("Créer une tâche directement en En cours", async () => {
      await tasksPage.createTask({
        title: taskTitle,
        status: "En cours",
      });
      await tasksPage.expectTaskInStatus(taskTitle, "En cours");
    });

    await test.step("Passer la tâche en En revue", async () => {
      await tasksPage.updateTaskMetadata(taskTitle, { status: "En revue" });
      await tasksPage.expectTaskInStatus(taskTitle, "En revue");
    });
  });

  test("définit puis modifie la priorité d'une tâche", async ({
    tasksPage,
  }) => {
    const taskTitle = buildTaskTitle("E2E priority task");

    await test.step("Créer une tâche en priorité Basse", async () => {
      await tasksPage.createTask({
        title: taskTitle,
        priority: "Basse",
      });
      await tasksPage.expectTaskVisible(taskTitle);
    });

    await test.step("Modifier la priorité en Urgente", async () => {
      await tasksPage.updateTaskMetadata(taskTitle, { priority: "Urgente" });
      await tasksPage.expectTaskVisible(taskTitle);
    });

    await test.step("Vérifier le filtre sur priorité Urgente", async () => {
      await tasksPage.filterByPriority("Urgente");
      await tasksPage.expectTaskVisible(taskTitle);
      await tasksPage.clearPriorityFilter();
    });
  });

  test("définit puis modifie la date d'échéance d'une tâche", async ({
    tasksPage,
  }) => {
    const taskTitle = buildTaskTitle("E2E due-date task");

    await test.step("Créer une tâche avec une échéance", async () => {
      await tasksPage.createTask({
        title: taskTitle,
        dueInDays: 1,
      });
      await tasksPage.expectTaskVisible(taskTitle);
    });

    await test.step("Modifier la date d'échéance", async () => {
      await tasksPage.updateTaskMetadata(taskTitle, { dueInDays: 2 });
      await tasksPage.expectTaskVisible(taskTitle);
    });
  });
});
