import { expect, request, test } from "@playwright/test";

test.describe("API Auth - /api/v1/me", () => {
  test("renvoie 200 si authentifie", async ({ request }) => {
    const res = await test.step("Appeler GET /api/v1/me", async () => {
      return request.get("/api/v1/me");
    });

    await test.step("Verifier le statut 200", async () => {
      expect(res.status()).toBe(200);
    });

    await test.step("Verifier le payload utilisateur", async () => {
      const body = await res.json();
      expect(body.ok).toBe(true);
      expect(body.data.email).toBeTruthy();
    });
  });

  test("renvoie 401 sans cookie", async ({ baseURL }) => {
    const anon = await test.step("Creer un contexte API anonyme", async () => {
      return request.newContext({
        baseURL,
        storageState: { cookies: [], origins: [] },
      });
    });

    const res =
      await test.step("Appeler GET /api/v1/me sans session", async () => {
        return anon.get("/api/v1/me");
      });

    await test.step("Verifier le statut 401", async () => {
      expect(res.status()).toBe(401);
    });

    await test.step("Nettoyer le contexte anonyme", async () => {
      await anon.dispose();
    });
  });
});
