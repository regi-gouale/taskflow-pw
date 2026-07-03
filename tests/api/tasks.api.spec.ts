import type { APIRequestContext } from "@playwright/test";
import { expect, test } from "@/fixtures/api.fixture";

type TaskLike = {
  id?: string | number;
  _id?: string | number;
  taskId?: string | number;
  title?: string;
  status?: string;
  priority?: string;
  completed?: boolean;
  done?: boolean;
};

const buildTitle = (prefix: string): string =>
  `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

const extractTasksFromPayload = (payload: unknown): TaskLike[] => {
  if (Array.isArray(payload)) {
    return payload as TaskLike[];
  }
  if (payload && typeof payload === "object") {
    const obj = payload as Record<string, unknown>;
    if (Array.isArray(obj.data)) return obj.data as TaskLike[];
    if (Array.isArray(obj.tasks)) return obj.tasks as TaskLike[];
    if (Array.isArray(obj.items)) return obj.items as TaskLike[];
  }
  return [];
};

const extractTaskFromPayload = (payload: unknown): TaskLike | null => {
  if (payload && typeof payload === "object" && !Array.isArray(payload)) {
    const obj = payload as Record<string, unknown>;
    if (obj.data && typeof obj.data === "object" && !Array.isArray(obj.data))
      return obj.data as TaskLike;
    if (obj.task && typeof obj.task === "object" && !Array.isArray(obj.task))
      return obj.task as TaskLike;
    return obj as TaskLike;
  }
  return null;
};

const getTaskId = (
  task: TaskLike | null | undefined,
): string | number | null => {
  if (!task) return null;
  return task.id ?? task._id ?? task.taskId ?? null;
};

const listTasks = async (request: APIRequestContext): Promise<TaskLike[]> => {
  const res = await request.get("/api/v1/tasks");
  expect(res.status()).toBe(200);
  const payload = await res.json();
  return extractTasksFromPayload(payload);
};

const createTask = async (
  request: APIRequestContext,
  title: string,
  extra: Record<string, unknown> = {},
): Promise<TaskLike> => {
  const res = await request.post("/api/v1/tasks", {
    data: { title, ...extra },
  });

  expect([200, 201]).toContain(res.status());

  let created = extractTaskFromPayload(await res.json());
  let createdId = getTaskId(created);

  if (!createdId) {
    const tasks = await listTasks(request);
    created = tasks.find((task) => task.title === title) ?? null;
    createdId = getTaskId(created);
  }

  expect(created).toBeTruthy();
  expect(createdId).toBeTruthy();

  return created as TaskLike;
};

const updateTask = async (
  request: APIRequestContext,
  id: string | number,
  patch: Record<string, unknown>,
): Promise<void> => {
  const candidates = [
    () => request.patch(`/api/v1/tasks/${id}`, { data: patch }),
    () => request.put(`/api/v1/tasks/${id}`, { data: patch }),
    () => request.patch("/api/v1/tasks", { data: { id, ...patch } }),
    () => request.put("/api/v1/tasks", { data: { id, ...patch } }),
  ];

  for (const attempt of candidates) {
    const res = await attempt();
    if ([200, 204].includes(res.status())) {
      return;
    }
  }

  throw new Error(`Mise a jour impossible pour la tache ${id}`);
};

const deleteTask = async (
  request: APIRequestContext,
  id: string | number,
): Promise<void> => {
  const candidates = [
    () => request.delete(`/api/v1/tasks/${id}`),
    () => request.delete("/api/v1/tasks", { params: { id: String(id) } }),
  ];

  for (const attempt of candidates) {
    const res = await attempt();
    if ([200, 204].includes(res.status())) {
      return;
    }
  }

  throw new Error(`Suppression impossible pour la tache ${id}`);
};

test.describe("API Tasks - gestion complete", () => {
  test("cree puis liste une tache", async ({ request }) => {
    const title = buildTitle("api-create-list");

    await test.step("Créer une tâche", async () => {
      await createTask(request, title);
    });

    await test.step("Vérifier que la tâche est listée", async () => {
      const tasks = await listTasks(request);
      const created = tasks.find((task) => task.title === title);
      expect(created).toBeTruthy();
    });
  });

  test("met a jour le titre d'une tache", async ({ request }) => {
    const initialTitle = buildTitle("api-update-title-before");
    const updatedTitle = `${initialTitle}-after`;

    const created = await test.step("Créer la tâche à modifier", async () => {
      return createTask(request, initialTitle);
    });
    const id = getTaskId(created);
    expect(id).toBeTruthy();

    await test.step("Modifier le titre", async () => {
      await updateTask(request, id as string | number, { title: updatedTitle });
    });

    await test.step("Vérifier le nouveau titre dans la liste", async () => {
      const tasks = await listTasks(request);
      const oldTask = tasks.find((task) => task.title === initialTitle);
      const newTask = tasks.find((task) => task.title === updatedTitle);

      expect(newTask).toBeTruthy();
      expect(oldTask).toBeFalsy();
    });
  });

  test("met a jour les metadonnees (statut, priorite, completion)", async ({
    request,
  }) => {
    const title = buildTitle("api-update-meta");
    const created = await createTask(request, title);
    const id = getTaskId(created);
    expect(id).toBeTruthy();

    await test.step("Essayer de mettre à jour statut, priorité et état", async () => {
      await updateTask(request, id as string | number, {
        status: "IN_PROGRESS",
        priority: "URGENT",
        completed: true,
      });
    });

    await test.step("Vérifier que la tâche existe toujours", async () => {
      const tasks = await listTasks(request);
      const updated = tasks.find(
        (task) => String(getTaskId(task)) === String(id),
      );
      expect(updated).toBeTruthy();
    });
  });

  test("supprime une tache", async ({ request }) => {
    const title = buildTitle("api-delete");
    const created = await createTask(request, title);
    const id = getTaskId(created);
    expect(id).toBeTruthy();

    await test.step("Supprimer la tâche", async () => {
      await deleteTask(request, id as string | number);
    });

    await test.step("Vérifier que la tâche n'est plus listée", async () => {
      const tasks = await listTasks(request);
      const deleted = tasks.find(
        (task) => String(getTaskId(task)) === String(id),
      );
      expect(deleted).toBeFalsy();
    });
  });

  test("refuse la creation sans titre", async ({ request }) => {
    await test.step("Tenter de créer une tâche invalide", async () => {
      const res = await request.post("/api/v1/tasks", {
        data: {},
      });

      expect([400, 422]).toContain(res.status());
    });
  });
});
