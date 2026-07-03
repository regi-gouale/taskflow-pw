import { expect, test } from "@/fixtures/page.fixture";

const buildTaskTitle = (prefix: string): string =>
  `${prefix} ${Date.now()}-${Math.floor(Math.random() * 1000)}`;

test.describe("Gestion des tâches - CRUD", () => {
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

  test("crée une nouvelle tâche", async ({ tasksPage }) => {
    const taskTitle = buildTaskTitle("E2E create task");

    await test.step("Créer la tâche", async () => {
      await tasksPage.createTask({ title: taskTitle });
    });

    await test.step("Vérifier que la tâche est visible et non terminée", async () => {
      await tasksPage.expectTaskVisible(taskTitle);
      await tasksPage.expectTaskNotCompleted(taskTitle);
    });
  });

  test("modifie le titre d'une tâche", async ({ tasksPage }) => {
    const initialTitle = buildTaskTitle("E2E edit task");
    const updatedTitle = `${initialTitle} - updated`;

    await test.step("Créer la tâche à modifier", async () => {
      await tasksPage.createTask({ title: initialTitle });
      await tasksPage.expectTaskVisible(initialTitle);
    });

    await test.step("Renommer la tâche", async () => {
      await tasksPage.renameTask(initialTitle, updatedTitle);
    });

    await test.step("Vérifier le nouveau titre", async () => {
      await tasksPage.expectTaskNotVisible(initialTitle);
      await tasksPage.expectTaskVisible(updatedTitle);
      await tasksPage.expectTaskNotCompleted(updatedTitle);
    });
  });

  test("marque une tâche comme terminée", async ({ tasksPage }) => {
    const taskTitle = buildTaskTitle("E2E complete task");

    await test.step("Créer une tâche active", async () => {
      await tasksPage.createTask({ title: taskTitle });
      await tasksPage.expectTaskVisible(taskTitle);
      await tasksPage.expectTaskNotCompleted(taskTitle);
    });

    await test.step("Marquer la tâche comme terminée", async () => {
      await tasksPage.toggleTaskCompleted(taskTitle);
    });

    await test.step("Vérifier l'état terminé", async () => {
      await tasksPage.expectTaskVisible(taskTitle);
      await tasksPage.expectTaskCompleted(taskTitle);
    });
  });

  test("supprime une tâche", async ({ tasksPage }) => {
    const taskTitle = buildTaskTitle("E2E delete task");

    await test.step("Créer la tâche à supprimer", async () => {
      await tasksPage.createTask({ title: taskTitle });
      await tasksPage.expectTaskVisible(taskTitle);
    });

    await test.step("Supprimer la tâche", async () => {
      await tasksPage.deleteTask(taskTitle);
    });

    await test.step("Vérifier la suppression", async () => {
      await tasksPage.expectTaskNotVisible(taskTitle);
    });
  });
});
