import { expect, type Locator, type Page } from "@playwright/test";

const escapeRegex = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export type ProjectStatus = "Actif" | "En pause" | "Terminé" | "Archivé";

export class ProjectsPage {
  constructor(private readonly page: Page) {}

  get heading(): Locator {
    return this.page.getByRole("heading", { name: "Projets" });
  }

  get newProjectButton(): Locator {
    return this.page.getByTestId("new-project-button");
  }

  get createProjectDialog(): Locator {
    return this.page.getByRole("dialog", { name: "Nouveau projet" });
  }

  get editProjectDialog(): Locator {
    return this.page.getByRole("dialog", { name: "Modifier le projet" });
  }

  async goto(): Promise<void> {
    await this.page.goto("./dashboard/projects");
  }

  async expectLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(/\/dashboard\/projects/);
    await expect(this.heading).toBeVisible();
  }

  private projectCardsByName(name: string): Locator {
    return this.page
      .locator("h3", {
        hasText: new RegExp(`^${escapeRegex(name)}$`),
      })
      .locator('xpath=ancestor::*[@data-testid="project-card"][1]');
  }

  projectCard(name: string): Locator {
    return this.projectCardsByName(name).first();
  }

  projectMenuButton(name: string): Locator {
    return this.projectCard(name).getByTestId("project-menu");
  }

  async createProject(options: {
    name: string;
    description?: string;
    status?: ProjectStatus;
  }): Promise<void> {
    await this.newProjectButton.click();
    await expect(this.createProjectDialog).toBeVisible();

    await this.createProjectDialog
      .getByTestId("project-name-input")
      .fill(options.name);

    if (options.description !== undefined) {
      await this.createProjectDialog
        .getByTestId("project-description-input")
        .fill(options.description);
    }

    if (options.status) {
      await this.createProjectDialog
        .getByTestId("project-status-select")
        .click();
      await this.page.getByRole("option", { name: options.status }).click();
    }

    await this.createProjectDialog.getByTestId("project-submit").click();
    await expect(this.createProjectDialog).not.toBeVisible();
  }

  async openProjectActions(name: string): Promise<void> {
    await this.projectMenuButton(name).click();
    await expect(
      this.page.getByRole("menuitem", { name: "Modifier" }),
    ).toBeVisible();
  }

  async updateProject(
    currentName: string,
    updates: { name?: string; description?: string; status?: ProjectStatus },
  ): Promise<void> {
    await this.openProjectActions(currentName);
    await this.page.getByRole("menuitem", { name: "Modifier" }).click();

    await expect(this.editProjectDialog).toBeVisible();

    if (updates.name !== undefined) {
      await this.editProjectDialog
        .getByTestId("project-name-input")
        .fill(updates.name);
    }

    if (updates.description !== undefined) {
      await this.editProjectDialog
        .getByTestId("project-description-input")
        .fill(updates.description);
    }

    if (updates.status) {
      await this.editProjectDialog.getByTestId("project-status-select").click();
      await this.page.getByRole("option", { name: updates.status }).click();
    }

    await this.editProjectDialog
      .getByRole("button", { name: "Enregistrer" })
      .click();
    await expect(this.editProjectDialog).not.toBeVisible();
  }

  async deleteProject(name: string): Promise<void> {
    this.page.once("dialog", (dialog) => {
      dialog.accept();
    });

    await this.openProjectActions(name);
    await this.page.getByRole("menuitem", { name: "Supprimer" }).click();
  }

  async openProjectTasks(name: string): Promise<void> {
    await this.projectCard(name)
      .getByRole("link", { name: "Voir les tâches" })
      .click();
  }

  async expectProjectVisible(name: string): Promise<void> {
    await expect(this.projectCard(name)).toBeVisible();
  }

  async expectProjectNotVisible(name: string): Promise<void> {
    await expect(this.projectCardsByName(name)).toHaveCount(0);
  }

  async expectProjectStatus(
    name: string,
    status: ProjectStatus,
  ): Promise<void> {
    await expect(this.projectCard(name)).toContainText(status);
  }
}
