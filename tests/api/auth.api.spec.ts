import { expect, request, test } from "@playwright/test";

test("GET /api/v1/me renvoie 200 si authentifié", async ({ request }) => {
  const res = await request.get("/api/v1/me");
  expect(res.status()).toBe(200);

  const body = await res.json();
  expect(body.ok).toBe(true);
  expect(body.data.email).toBeTruthy();
});

test("GET /api/v1/me renvoie 401 sans cookie", async ({ baseURL }) => {
  const anon = await request.newContext({
    baseURL,
    storageState: { cookies: [], origins: [] },
  });
  const res = await anon.get("/api/v1/me");
  expect(res.status()).toBe(401);
  await anon.dispose();
});
