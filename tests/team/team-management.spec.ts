import { expect, test } from "@/fixtures/page.fixture";

const buildUniqueLabel = (prefix: string): string =>
  `${prefix} ${Date.now()}-${Math.floor(Math.random() * 1000)}`;

test.describe("Gestion de l'équipe", () => {
  test.beforeEach(async ({ authenticatedPage, teamPage }) => {
    await expect(authenticatedPage).toHaveURL(/\/dashboard$/);
    await teamPage.goto();
    await teamPage.expectLoaded();
  });

  test.afterEach(async ({ page }) => {
    await page.context().clearCookies();
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test("ajoute un membre à l'équipe", async ({ teamPage, testData }) => {
    const member = testData.teamMember({
      name: buildUniqueLabel("E2E member create"),
      role: "QA Engineer",
    });

    await test.step("Ajouter un nouveau membre", async () => {
      await teamPage.addMember(member);
    });

    await test.step("Vérifier la présence et les informations du membre", async () => {
      await teamPage.expectMemberVisible(member.name);
      await teamPage.expectMemberEmail(member.name, member.email);
      await teamPage.expectMemberRole(member.name, member.role);
    });
  });

  test("modifie les informations d'un membre", async ({
    teamPage,
    testData,
  }) => {
    const initialMember = testData.teamMember({
      name: buildUniqueLabel("E2E member edit"),
      role: "QA Engineer",
    });
    const updatedName = `${initialMember.name} - updated`;
    const updatedRole = "Senior QA Engineer";

    await test.step("Créer le membre à modifier", async () => {
      await teamPage.addMember(initialMember);
      await teamPage.expectMemberVisible(initialMember.name);
    });

    await test.step("Modifier le nom et le rôle", async () => {
      await teamPage.updateMember(initialMember.name, {
        name: updatedName,
        role: updatedRole,
      });
    });

    await test.step("Vérifier la mise à jour", async () => {
      await teamPage.expectMemberNotVisible(initialMember.name);
      await teamPage.expectMemberVisible(updatedName);
      await teamPage.expectMemberEmail(updatedName, initialMember.email);
      await teamPage.expectMemberRole(updatedName, updatedRole);
    });
  });

  test("ouvre les tâches assignées d'un membre", async ({
    page,
    teamPage,
    testData,
  }) => {
    const member = testData.teamMember({
      name: buildUniqueLabel("E2E member tasks"),
      role: "Project Manager",
    });

    await test.step("Créer un membre", async () => {
      await teamPage.addMember(member);
      await teamPage.expectMemberVisible(member.name);
    });

    await test.step("Ouvrir les tâches assignées depuis la fiche membre", async () => {
      await teamPage.openAssignedTasks(member.name);
    });

    await test.step("Vérifier la navigation vers la page des tâches filtrée", async () => {
      await expect(page).toHaveURL(/\/dashboard\/tasks\?assignee=/);
      await expect(
        page.getByRole("heading", { name: "Mes tâches" }),
      ).toBeVisible();
    });
  });

  test("retire un membre de l'équipe", async ({ teamPage, testData }) => {
    const member = testData.teamMember({
      name: buildUniqueLabel("E2E member remove"),
      role: "Backend Developer",
    });

    await test.step("Créer le membre à retirer", async () => {
      await teamPage.addMember(member);
      await teamPage.expectMemberVisible(member.name);
    });

    await test.step("Retirer le membre", async () => {
      await teamPage.removeMember(member.name);
    });

    await test.step("Vérifier la suppression du membre", async () => {
      await teamPage.expectMemberNotVisible(member.name);
    });
  });
});
