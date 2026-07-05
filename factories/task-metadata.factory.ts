type TaskMetadataPayload = {
  status?: "À faire" | "En cours" | "En revue" | "Terminé";
  priority?: "Basse" | "Moyenne" | "Haute" | "Urgente";
  dueInDays?: number;
};

export interface TaskMetadataCase {
  title: string;
  taskTitlePrefix: string;
  createStepTitle: string;
  updateStepTitle: string;
  createPayload: TaskMetadataPayload;
  updatePayload: TaskMetadataPayload;
  expectedStatusAfterCreate?: "À faire" | "En cours" | "En revue" | "Terminé";
  expectedStatusAfterUpdate?: "À faire" | "En cours" | "En revue" | "Terminé";
  verifyUrgentPriorityFilter: boolean;
}

class TaskMetadataFactory {
  buildCases(): ReadonlyArray<TaskMetadataCase> {
    return [
      {
        title: "définit puis modifie le statut d'une tâche",
        taskTitlePrefix: "E2E status task",
        createStepTitle: "Créer une tâche directement en En cours",
        updateStepTitle: "Passer la tâche en En revue",
        createPayload: {
          status: "En cours",
        },
        updatePayload: {
          status: "En revue",
        },
        expectedStatusAfterCreate: "En cours",
        expectedStatusAfterUpdate: "En revue",
        verifyUrgentPriorityFilter: false,
      },
      {
        title: "définit puis modifie la priorité d'une tâche",
        taskTitlePrefix: "E2E priority task",
        createStepTitle: "Créer une tâche en priorité Basse",
        updateStepTitle: "Modifier la priorité en Urgente",
        createPayload: {
          priority: "Basse",
        },
        updatePayload: {
          priority: "Urgente",
        },
        verifyUrgentPriorityFilter: true,
      },
      {
        title: "définit puis modifie la date d'échéance d'une tâche",
        taskTitlePrefix: "E2E due-date task",
        createStepTitle: "Créer une tâche avec une échéance",
        updateStepTitle: "Modifier la date d'échéance",
        createPayload: {
          dueInDays: 1,
        },
        updatePayload: {
          dueInDays: 2,
        },
        verifyUrgentPriorityFilter: false,
      },
    ];
  }
}

export const taskMetadataFactory = new TaskMetadataFactory();
