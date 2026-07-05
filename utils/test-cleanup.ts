import type { APIRequestContext, Response } from "@playwright/test";

type StorageState = Awaited<ReturnType<APIRequestContext["storageState"]>>;

type PlaywrightRequestFactory = {
  request: {
    newContext: (options: {
      baseURL?: string;
      storageState?: StorageState;
    }) => Promise<APIRequestContext>;
  };
};

type EntityKind = "tasks" | "projects" | "members" | "users";

type EntityConfig = {
  kind: EntityKind;
  listCandidates: string[];
  createPathTokens: string[];
};

type SnapshotEntry = {
  endpoint: string;
  ids: Set<string>;
};

type CleanupSnapshot = Partial<Record<EntityKind, SnapshotEntry>>;

type TrackableResponse = Response;

const entityConfigs: EntityConfig[] = [
  {
    kind: "tasks",
    listCandidates: ["/api/v1/tasks"],
    createPathTokens: ["/api/v1/tasks"],
  },
  {
    kind: "projects",
    listCandidates: ["/api/v1/projects"],
    createPathTokens: ["/api/v1/projects"],
  },
  {
    kind: "members",
    listCandidates: ["/api/v1/team-members", "/api/v1/members", "/api/v1/team"],
    createPathTokens: [
      "/api/v1/team-members",
      "/api/v1/members",
      "/api/v1/team",
    ],
  },
  {
    kind: "users",
    listCandidates: ["/api/v1/users", "/api/users"],
    createPathTokens: ["/api/auth/sign-up", "/api/v1/users", "/api/users"],
  },
];

const possibleCollectionKeys = [
  "data",
  "items",
  "tasks",
  "projects",
  "members",
  "users",
  "results",
  "team",
];

const possibleIdKeys = [
  "id",
  "_id",
  "taskId",
  "projectId",
  "memberId",
  "userId",
];

const toStringId = (value: unknown): string | null => {
  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }

  return null;
};

const extractIdFromObject = (value: unknown): string | null => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const record = value as Record<string, unknown>;

  for (const key of possibleIdKeys) {
    const id = toStringId(record[key]);
    if (id) {
      return id;
    }
  }

  return null;
};

const extractEntityArray = (payload: unknown): unknown[] => {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (!payload || typeof payload !== "object") {
    return [];
  }

  const record = payload as Record<string, unknown>;

  for (const key of possibleCollectionKeys) {
    const candidate = record[key];
    if (Array.isArray(candidate)) {
      return candidate;
    }
  }

  return [];
};

const extractIdsFromPayload = (payload: unknown): Set<string> => {
  const entities = extractEntityArray(payload);
  const ids = new Set<string>();

  for (const entity of entities) {
    const id = extractIdFromObject(entity);
    if (id) {
      ids.add(id);
    }
  }

  return ids;
};

const discoverListEndpoint = async (
  requestContext: APIRequestContext,
  candidates: string[],
): Promise<SnapshotEntry | null> => {
  for (const endpoint of candidates) {
    const response = await requestContext.get(endpoint);

    if (!response.ok()) {
      continue;
    }

    try {
      const payload = await response.json();
      return {
        endpoint,
        ids: extractIdsFromPayload(payload),
      };
    } catch {
      // Ignore non-JSON payloads and keep trying candidates.
    }
  }

  return null;
};

const deleteByEndpointCandidates = async (
  requestContext: APIRequestContext,
  endpoint: string,
  id: string,
): Promise<boolean> => {
  const baseEndpoint = endpoint.split("?")[0] ?? endpoint;
  const staticBases = new Set<string>([baseEndpoint]);

  for (const config of entityConfigs) {
    for (const candidate of config.listCandidates) {
      staticBases.add(candidate);
    }
  }

  for (const base of staticBases) {
    const responseByPath = await requestContext.delete(`${base}/${id}`);
    if (
      responseByPath.ok() ||
      [200, 202, 204].includes(responseByPath.status())
    ) {
      return true;
    }

    const responseByQuery = await requestContext.delete(base, {
      params: { id },
    });

    if (
      responseByQuery.ok() ||
      [200, 202, 204].includes(responseByQuery.status())
    ) {
      return true;
    }
  }

  return false;
};

const detectCreatedEntityKind = (url: string): EntityKind | null => {
  for (const config of entityConfigs) {
    if (config.createPathTokens.some((token) => url.includes(token))) {
      return config.kind;
    }
  }

  return null;
};

type CleanupTracker = {
  trackResponse: (response: TrackableResponse) => Promise<void>;
  cleanup: (currentStorageState: StorageState) => Promise<void>;
};

export const createCleanupTracker = async (
  playwright: PlaywrightRequestFactory,
  baseURL: string | undefined,
  initialStorageState: StorageState,
): Promise<CleanupTracker> => {
  const initialContext = await playwright.request.newContext({
    baseURL,
    storageState: initialStorageState,
  });

  const snapshot: CleanupSnapshot = {};
  for (const config of entityConfigs) {
    const currentSnapshot = await discoverListEndpoint(
      initialContext,
      config.listCandidates,
    );

    if (currentSnapshot) {
      snapshot[config.kind] = currentSnapshot;
    }
  }

  await initialContext.dispose();

  const createdIdsByKind: Record<EntityKind, Set<string>> = {
    tasks: new Set<string>(),
    projects: new Set<string>(),
    members: new Set<string>(),
    users: new Set<string>(),
  };

  const trackResponse = async (response: TrackableResponse): Promise<void> => {
    const method = response.request().method();
    if (method !== "POST") {
      return;
    }

    const kind = detectCreatedEntityKind(response.url());
    if (!kind || !response.ok()) {
      return;
    }

    try {
      const payload = await response.json();
      const ids = extractIdsFromPayload(payload);

      if (ids.size > 0) {
        for (const id of ids) {
          createdIdsByKind[kind].add(id);
        }
        return;
      }

      const id = extractIdFromObject(payload);
      if (id) {
        createdIdsByKind[kind].add(id);
      }
    } catch {
      // Ignore responses that do not have a JSON body.
    }
  };

  const cleanup = async (currentStorageState: StorageState): Promise<void> => {
    const cleanupContext = await playwright.request.newContext({
      baseURL,
      storageState: currentStorageState,
    });

    for (const config of entityConfigs) {
      const current = await discoverListEndpoint(
        cleanupContext,
        config.listCandidates,
      );

      const baselineIds = snapshot[config.kind]?.ids ?? new Set<string>();
      const diffIds = new Set<string>();

      if (current) {
        for (const id of current.ids) {
          if (!baselineIds.has(id)) {
            diffIds.add(id);
          }
        }
      }

      for (const id of createdIdsByKind[config.kind]) {
        diffIds.add(id);
      }

      const preferredEndpoint =
        current?.endpoint ??
        snapshot[config.kind]?.endpoint ??
        config.listCandidates[0] ??
        "/api/v1/tasks";

      for (const id of diffIds) {
        await deleteByEndpointCandidates(cleanupContext, preferredEndpoint, id);
      }
    }

    await cleanupContext.dispose();
  };

  return {
    trackResponse,
    cleanup,
  };
};
