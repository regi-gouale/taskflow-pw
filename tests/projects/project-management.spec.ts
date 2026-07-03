import { expect, test } from "@/fixtures/page.fixture";

const buildProjectName = (prefix: string): string =>
  `${prefix} ${Date.now()}-${Math.floor(Math.random() * 1000)}`;

test.describe("Gestion des projets", () => {
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

  test("crée un nouveau projet", async ({ projectsPage }) => {
    const projectName = buildProjectName("E2E project create");

    await test.step("Créer un projet actif", async () => {
      await projectsPage.createProject({
        name: projectName,
        description: "Projet créé en E2E",
        status: "Actif",
      });
    });

    await test.step("Vérifier la présence du projet", async () => {
      await projectsPage.expectProjectVisible(projectName);
      await projectsPage.expectProjectStatus(projectName, "Actif");
    });
  });

  test("modifie les informations d'un projet", async ({ projectsPage }) => {
    const initialName = buildProjectName("E2E project edit");
    const updatedName = `${initialName} - updated`;

    await test.step("Créer le projet à modifier", async () => {
      await projectsPage.createProject({
        name: initialName,
        description: "Description initiale",
        status: "Actif",
      });
      await projectsPage.expectProjectVisible(initialName);
    });

    await test.step("Modifier nom, description et statut", async () => {
      await projectsPage.updateProject(initialName, {
        name: updatedName,
        description: "Description mise à jour",
        status: "En pause",
      });
    });

    await test.step("Vérifier les changements", async () => {
      await projectsPage.expectProjectNotVisible(initialName);
      await projectsPage.expectProjectVisible(updatedName);
      await projectsPage.expectProjectStatus(updatedName, "En pause");
    });
  });

  test("supprime un projet", async ({ projectsPage }) => {
    const projectName = buildProjectName("E2E project delete");

    await test.step("Créer le projet à supprimer", async () => {
      await projectsPage.createProject({
        name: projectName,
        description: "Projet temporaire",
      });
      await projectsPage.expectProjectVisible(projectName);
    });

    await test.step("Supprimer le projet", async () => {
      await projectsPage.deleteProject(projectName);
    });

    await test.step("Vérifier la suppression", async () => {
      await projectsPage.expectProjectNotVisible(projectName);
    });
  });

  test("ouvre la vue des tâches d'un projet", async ({
    page,
    projectsPage,
  }) => {
    const projectName = buildProjectName("E2E project tasks link");

    await test.step("Créer un projet", async () => {
      await projectsPage.createProject({
        name: projectName,
        description: "Lien vers les tâches",
      });
      await projectsPage.expectProjectVisible(projectName);
    });

    await test.step("Ouvrir les tâches du projet", async () => {
      await projectsPage.openProjectTasks(projectName);
    });

    await test.step("Vérifier la navigation", async () => {
      await expect(page).toHaveURL(/\/dashboard\/tasks\?project=/);
    });
  });
});
