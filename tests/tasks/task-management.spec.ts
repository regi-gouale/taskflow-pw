import { expect, test } from "@/fixtures/page.fixture";

const buildTaskTitle = (prefix: string): string =>
  `${prefix} ${Date.now()}-${Math.floor(Math.random() * 1000)}`;

test.describe("Gestion des tâches", () => {
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

  test("glisser-déposer une tâche entre statuts", async ({ tasksPage }) => {
    const taskTitle = buildTaskTitle("E2E drag task");

    await test.step("Créer la tâche dans À faire", async () => {
      await tasksPage.createTask({ title: taskTitle, status: "À faire" });
      await tasksPage.expectTaskVisible(taskTitle);
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
