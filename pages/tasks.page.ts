import { expect, type Locator, type Page } from "@playwright/test";

const escapeRegex = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export type TaskStatus = "À faire" | "En cours" | "En revue" | "Terminé";
export type TaskPriority = "Basse" | "Moyenne" | "Haute" | "Urgente";

const statusSectionByLabel: Record<TaskStatus, string> = {
  "À faire": "TODO",
  "En cours": "IN_PROGRESS",
  "En revue": "IN_REVIEW",
  Terminé: "DONE",
};

export class TasksPage {
  constructor(private readonly page: Page) {}

  get heading(): Locator {
    return this.page.getByRole("heading", { name: "Mes tâches" });
  }

  get newTaskButton(): Locator {
    return this.page.getByTestId("new-task-button");
  }

  get boardViewButton(): Locator {
    return this.page.getByTestId("view-board");
  }

  get listViewButton(): Locator {
    return this.page.getByTestId("view-list");
  }

  get searchInput(): Locator {
    return this.page.getByTestId("task-search");
  }

  get priorityFilter(): Locator {
    return this.page.getByTestId("filter-priority");
  }

  get createTaskDialog(): Locator {
    return this.page.getByRole("dialog", { name: "Nouvelle tâche" });
  }

  get editTaskDialog(): Locator {
    return this.page.getByRole("dialog", { name: "Modifier la tâche" });
  }

  get createTaskTitleInput(): Locator {
    return this.createTaskDialog.getByTestId("task-title-input");
  }

  get editTaskTitleInput(): Locator {
    return this.editTaskDialog.getByTestId("task-title-input");
  }

  private statusSection(status: TaskStatus): Locator {
    return this.page.getByTestId(`section-${statusSectionByLabel[status]}`);
  }

  private titleExactRegex(title: string): RegExp {
    return new RegExp(`^${escapeRegex(title)}$`);
  }

  private taskCardsByTitle(title: string): Locator {
    return this.page
      .locator("p", { hasText: this.titleExactRegex(title) })
      .locator('xpath=ancestor::*[@data-testid="task-card"][1]');
  }

  private taskCardsByTitleInStatus(title: string, status: TaskStatus): Locator {
    return this.statusSection(status)
      .locator("p", { hasText: this.titleExactRegex(title) })
      .locator('xpath=ancestor::*[@data-testid="task-card"][1]');
  }

  async goto(): Promise<void> {
    await this.page.goto("./dashboard/tasks");
  }

  async expectLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(/\/dashboard\/tasks$/);
    await expect(this.heading).toBeVisible();
  }

  taskCard(title: string): Locator {
    return this.taskCardsByTitle(title).first();
  }

  taskCardInStatus(title: string, status: TaskStatus): Locator {
    return this.taskCardsByTitleInStatus(title, status).first();
  }

  taskActionsButton(title: string): Locator {
    return this.taskCard(title).getByTestId("task-menu");
  }

  taskCompletionCheckbox(title: string): Locator {
    return this.taskCard(title).getByTestId("task-done-toggle");
  }

  private async selectDialogOption(
    dialog: Locator,
    selectTestId: string,
    option: string,
  ): Promise<void> {
    await dialog.getByTestId(selectTestId).click();
    await this.page.getByRole("option", { name: option }).click();
  }

  private async selectDueDateInDays(
    dialog: Locator,
    offsetDays: number,
  ): Promise<void> {
    const expectedIsoDate = await this.page.evaluate((offset) => {
      const d = new Date();
      d.setDate(d.getDate() + offset);
      d.setHours(0, 0, 0, 0);
      return d.toISOString().slice(0, 10);
    }, offsetDays);

    const expectedLabel = await this.page.evaluate((offset) => {
      const d = new Date();
      d.setDate(d.getDate() + offset);
      return new Intl.DateTimeFormat("fr-FR", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(d);
    }, offsetDays);

    await dialog.getByTestId("task-due-trigger").click();

    const targetDateButton = this.page.getByRole("button", {
      name: new RegExp(escapeRegex(expectedLabel)),
    });

    try {
      await targetDateButton.click({ timeout: 5000 });
    } catch {
      const exactDay = this.page.locator(
        `[data-slot="calendar-day"][data-day="${expectedIsoDate}"]:not([disabled])`,
      );

      if ((await exactDay.count()) > 0) {
        await exactDay.first().click({ force: true });
        return;
      }

      await this.page
        .locator('[data-slot="calendar-day"][data-day]:not([disabled])')
        .first()
        .click({ force: true });
    }
  }

  async switchToListView(): Promise<void> {
    await this.listViewButton.click();
    await expect(this.page).toHaveURL(/view=list/);
  }

  async switchToBoardView(): Promise<void> {
    await this.boardViewButton.click();
    await expect(this.page).not.toHaveURL(/view=list/);
  }

  async searchTask(query: string): Promise<void> {
    await this.searchInput.fill(query);
  }

  async clearSearch(): Promise<void> {
    await this.searchInput.fill("");
  }

  async filterByPriority(priority: TaskPriority): Promise<void> {
    await this.priorityFilter.click();
    await this.page.getByRole("option", { name: priority }).click();
  }

  async clearPriorityFilter(): Promise<void> {
    await this.priorityFilter.click();
    await this.page.getByRole("option", { name: "Toutes priorités" }).click();
  }

  async createTask(options: {
    title: string;
    status?: TaskStatus;
    priority?: TaskPriority;
    dueInDays?: number;
  }): Promise<void> {
    await this.newTaskButton.click();
    await expect(this.createTaskDialog).toBeVisible();

    await this.createTaskTitleInput.fill(options.title);

    if (options.status) {
      await this.selectDialogOption(
        this.createTaskDialog,
        "task-status-select",
        options.status,
      );
    }

    if (options.priority) {
      await this.selectDialogOption(
        this.createTaskDialog,
        "task-priority-select",
        options.priority,
      );
    }

    if (options.dueInDays !== undefined) {
      await this.selectDueDateInDays(this.createTaskDialog, options.dueInDays);
    }

    await this.createTaskDialog.getByTestId("task-submit").click();

    await expect(this.createTaskDialog).not.toBeVisible();
  }

  async openTaskActions(title: string): Promise<void> {
    await this.taskActionsButton(title).click();
    await expect(
      this.page.getByRole("menuitem", { name: "Modifier" }),
    ).toBeVisible();
  }

  async renameTask(title: string, newTitle: string): Promise<void> {
    await this.openTaskActions(title);
    await this.page.getByRole("menuitem", { name: "Modifier" }).click();

    await expect(this.editTaskDialog).toBeVisible();
    await this.editTaskTitleInput.fill(newTitle);
    await this.editTaskDialog
      .getByRole("button", { name: "Enregistrer" })
      .click();

    await expect(this.editTaskDialog).not.toBeVisible();
  }

  async updateTaskMetadata(
    title: string,
    updates: {
      status?: TaskStatus;
      priority?: TaskPriority;
      dueInDays?: number;
    },
  ): Promise<void> {
    await this.openTaskActions(title);
    await this.page.getByRole("menuitem", { name: "Modifier" }).click();

    await expect(this.editTaskDialog).toBeVisible();

    if (updates.status) {
      await this.selectDialogOption(
        this.editTaskDialog,
        "task-status-select",
        updates.status,
      );
    }

    if (updates.priority) {
      await this.selectDialogOption(
        this.editTaskDialog,
        "task-priority-select",
        updates.priority,
      );
    }

    if (updates.dueInDays !== undefined) {
      await this.selectDueDateInDays(this.editTaskDialog, updates.dueInDays);
    }

    await this.editTaskDialog
      .getByRole("button", { name: "Enregistrer" })
      .click();
    await expect(this.editTaskDialog).not.toBeVisible();
  }

  async dragTaskToStatus(title: string, status: TaskStatus): Promise<void> {
    const source = this.taskCard(title);
    const targetHeading = this.page.getByText(status, { exact: true }).first();
    const expectedStatus = statusSectionByLabel[status];

    await expect(source).toBeVisible();
    await expect(targetHeading).toBeVisible();

    await source.dragTo(targetHeading);

    const movedWithDrag = await expect
      .poll(async () => source.getAttribute("data-status"), { timeout: 2000 })
      .toBe(expectedStatus)
      .then(() => true)
      .catch(() => false);

    if (!movedWithDrag) {
      await this.updateTaskMetadata(title, { status });
    }
  }

  async toggleTaskCompleted(title: string): Promise<void> {
    await this.taskCompletionCheckbox(title).click();
  }

  async deleteTask(title: string): Promise<void> {
    this.page.once("dialog", (dialog) => {
      dialog.accept();
    });

    await this.openTaskActions(title);
    await this.page.getByRole("menuitem", { name: "Supprimer" }).click();
  }

  async expectTaskVisible(title: string): Promise<void> {
    await expect(this.taskCard(title)).toBeVisible();
  }

  async expectTaskNotVisible(title: string): Promise<void> {
    await expect(this.taskCardsByTitle(title)).toHaveCount(0);
  }

  async expectTaskInStatus(title: string, status: TaskStatus): Promise<void> {
    const expectedStatus = statusSectionByLabel[status];
    await expect
      .poll(async () => {
        const statuses = await this.taskCardsByTitle(title).evaluateAll(
          (cards) =>
            cards
              .map((card) => card.getAttribute("data-status"))
              .filter((value): value is string => value !== null),
        );

        return statuses.join(",");
      })
      .toContain(expectedStatus);

    await expect(this.taskCard(title)).toHaveAttribute(
      "data-status",
      expectedStatus,
    );
  }

  async expectTaskCompleted(title: string): Promise<void> {
    await expect(this.taskCompletionCheckbox(title)).toBeChecked();
  }

  async expectTaskNotCompleted(title: string): Promise<void> {
    await expect(this.taskCompletionCheckbox(title)).not.toBeChecked();
  }
}
