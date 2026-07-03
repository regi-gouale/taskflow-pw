import { expect, type Locator, type Page } from "@playwright/test";

const assignedTasksLinkName = /tâche(?:s)? assignée(?:s)?/i;

export class TeamPage {
  constructor(private readonly page: Page) {}

  get heading(): Locator {
    return this.page.getByRole("heading", { name: "Équipe" });
  }

  get addMemberButton(): Locator {
    return this.page.getByTestId("new-member-button");
  }

  get addMemberDialog(): Locator {
    return this.page.getByRole("dialog", { name: "Ajouter un membre" });
  }

  get editMemberDialog(): Locator {
    return this.page.getByRole("dialog", { name: "Modifier le membre" });
  }

  private memberCardsByName(name: string): Locator {
    return this.page
      .getByTestId("member-card")
      .filter({ has: this.page.getByText(name, { exact: true }) });
  }

  memberCard(name: string): Locator {
    return this.memberCardsByName(name).first();
  }

  async goto(): Promise<void> {
    await this.page.goto("./dashboard/team");
  }

  async expectLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(/\/dashboard\/team/);
    await expect(this.heading).toBeVisible();
  }

  async addMember(member: {
    name: string;
    email: string;
    role: string;
  }): Promise<void> {
    await this.addMemberButton.click();
    await expect(this.addMemberDialog).toBeVisible();

    await this.addMemberDialog
      .getByTestId("member-name-input")
      .fill(member.name);
    await this.addMemberDialog
      .getByTestId("member-email-input")
      .fill(member.email);
    await this.addMemberDialog
      .getByTestId("member-role-input")
      .fill(member.role);

    await this.addMemberDialog.getByTestId("member-submit").click();
    await expect(this.addMemberDialog).not.toBeVisible();
  }

  async openMemberActions(name: string): Promise<void> {
    await this.memberCard(name).getByTestId("member-menu").click();
    await expect(
      this.page.getByRole("menuitem", { name: "Modifier" }),
    ).toBeVisible();
  }

  async updateMember(
    currentName: string,
    updates: { name?: string; email?: string; role?: string },
  ): Promise<void> {
    await this.openMemberActions(currentName);
    await this.page.getByRole("menuitem", { name: "Modifier" }).click();

    await expect(this.editMemberDialog).toBeVisible();

    if (updates.name !== undefined) {
      await this.editMemberDialog
        .getByTestId("member-name-input")
        .fill(updates.name);
    }

    if (updates.email !== undefined) {
      await this.editMemberDialog
        .getByTestId("member-email-input")
        .fill(updates.email);
    }

    if (updates.role !== undefined) {
      await this.editMemberDialog
        .getByTestId("member-role-input")
        .fill(updates.role);
    }

    await this.editMemberDialog.getByTestId("member-submit").click();
    await expect(this.editMemberDialog).not.toBeVisible();
  }

  async removeMember(name: string): Promise<void> {
    this.page.once("dialog", (dialog) => {
      dialog.accept();
    });

    await this.openMemberActions(name);
    await this.page.getByRole("menuitem", { name: "Retirer" }).click();
  }

  async openAssignedTasks(name: string): Promise<void> {
    await this.memberCard(name)
      .getByRole("link", { name: assignedTasksLinkName })
      .click();
  }

  async expectMemberVisible(name: string): Promise<void> {
    await expect(this.memberCard(name)).toBeVisible();
  }

  async expectMemberNotVisible(name: string): Promise<void> {
    await expect(this.memberCardsByName(name)).toHaveCount(0);
  }

  async expectMemberRole(name: string, role: string): Promise<void> {
    await expect(
      this.memberCard(name).getByText(role, { exact: true }),
    ).toBeVisible();
  }

  async expectMemberEmail(name: string, email: string): Promise<void> {
    await expect(
      this.memberCard(name).getByRole("link", { name: email, exact: true }),
    ).toBeVisible();
  }
}
