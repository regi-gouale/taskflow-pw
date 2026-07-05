export interface MockEndpointNetworkCase {
  title: string;
  action: "server-error" | "slow-network" | "blocked";
  delayMs?: number;
  responseStatus?: number;
  responseBody?: Record<string, unknown>;
  requestEmail: string;
  expectedStatus?: number;
  expectedOk?: boolean;
  expectedResponseBody?: Record<string, unknown>;
  expectedFailureName?: string;
  minElapsedMs?: number;
}

export interface EntityCreationNetworkCase {
  title: string;
  action: "server-error" | "slow-network" | "blocked";
  namePrefix: string;
  delayMs?: number;
  shouldBeCreated: boolean;
  shouldIntercept: boolean;
}

class NetworkInterceptionFactory {
  buildMockEndpointCases(): ReadonlyArray<MockEndpointNetworkCase> {
    return [
      {
        title: "simule une erreur serveur avec un mock de réponse",
        action: "server-error",
        requestEmail: "test@taskflow.dev",
        responseStatus: 500,
        responseBody: {
          ok: false,
          message: "Internal Server Error",
        },
        expectedStatus: 500,
        expectedOk: false,
        expectedResponseBody: {
          ok: false,
          message: "Internal Server Error",
        },
      },
      {
        title: "simule un reseau lent avant de renvoyer la reponse",
        action: "slow-network",
        requestEmail: "slow@test.com",
        delayMs: 1200,
        responseStatus: 200,
        responseBody: {
          ok: true,
        },
        minElapsedMs: 1100,
      },
      {
        title: "bloque une requete avec abort",
        action: "blocked",
        requestEmail: "blocked@test.com",
        expectedFailureName: "TypeError",
      },
    ];
  }

  buildTaskCreationCases(): ReadonlyArray<EntityCreationNetworkCase> {
    return [
      {
        title: "simule une erreur serveur lors de la création d'une tâche",
        action: "server-error",
        namePrefix: "network-task-server-error",
        shouldBeCreated: false,
        shouldIntercept: true,
      },
      {
        title: "simule un réseau lent lors de la création d'une tâche",
        action: "slow-network",
        namePrefix: "network-task-slow",
        delayMs: 1200,
        shouldBeCreated: true,
        shouldIntercept: false,
      },
      {
        title: "bloque la requête de création d'une tâche",
        action: "blocked",
        namePrefix: "network-task-blocked",
        shouldBeCreated: false,
        shouldIntercept: true,
      },
    ];
  }

  buildProjectCreationCases(): ReadonlyArray<EntityCreationNetworkCase> {
    return [
      {
        title: "simule une erreur serveur lors de la création d'un projet",
        action: "server-error",
        namePrefix: "network-project-server-error",
        shouldBeCreated: false,
        shouldIntercept: true,
      },
      {
        title: "simule un réseau lent lors de la création d'un projet",
        action: "slow-network",
        namePrefix: "network-project-slow",
        delayMs: 1200,
        shouldBeCreated: true,
        shouldIntercept: false,
      },
      {
        title: "bloque la requête de création d'un projet",
        action: "blocked",
        namePrefix: "network-project-blocked",
        shouldBeCreated: false,
        shouldIntercept: true,
      },
    ];
  }
}

export const networkInterceptionFactory = new NetworkInterceptionFactory();
