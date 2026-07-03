import { request } from "@playwright/test";
import { expect, test } from "@/fixtures/api.fixture";

const attemptSignIn = async (
  anon: Awaited<ReturnType<typeof request.newContext>>,
  email: string,
  password: string,
) => {
  const envPath = process.env.API_SIGN_IN_PATH;
  const candidates = [envPath, "/api/auth/sign-in", "/api/auth/sign-in/email"]
    .filter(Boolean)
    .filter((value, index, arr) => arr.indexOf(value) === index) as string[];

  for (const path of candidates) {
    const res = await anon.post(path, {
      data: { email, password },
    });

    if (res.ok()) {
      return { path, res };
    }
  }

  return null;
};

test.describe("API Auth - /api/v1/me", () => {
  test("connexion API puis acces a /api/v1/me", async ({ baseURL }) => {
    const email = process.env.E2E_EMAIL ?? "test@taskflow.dev";
    const password = process.env.E2E_PASSWORD ?? "Password123!";

    const anon = await test.step("Creer un contexte API anonyme", async () => {
      return request.newContext({
        baseURL,
        storageState: { cookies: [], origins: [] },
      });
    });

    await test.step("Se connecter via endpoint de sign-in", async () => {
      const loginResult = await attemptSignIn(anon, email, password);
      expect(loginResult).toBeTruthy();
    });

    await test.step("Verifier que la session est active", async () => {
      const meRes = await anon.get("/api/v1/me");
      expect(meRes.status()).toBe(200);
      const body = await meRes.json();
      expect(body?.data?.email).toBeTruthy();
    });

    await test.step("Nettoyer le contexte", async () => {
      await anon.dispose();
    });
  });

  test("renvoie 200 si authentifie", async ({ request }) => {
    const res = await test.step("Appeler GET /api/v1/me", async () => {
      return request.get("/api/v1/me");
    });

    await test.step("Vérifier le statut 200", async () => {
      expect(res.status()).toBe(200);
    });

    await test.step("Vérifier le payload utilisateur", async () => {
      const body = await res.json();
      expect(body.ok).toBe(true);
      expect(body.data.email).toBeTruthy();
    });
  });

  test("renvoie 401 sans cookie", async ({ baseURL }) => {
    const anon = await test.step("Créer un contexte API anonyme", async () => {
      return request.newContext({
        baseURL,
        storageState: { cookies: [], origins: [] },
      });
    });

    const res =
      await test.step("Appeler GET /api/v1/me sans session", async () => {
        return anon.get("/api/v1/me");
      });

    await test.step("Vérifier le statut 401", async () => {
      expect(res.status()).toBe(401);
    });

    await test.step("Nettoyer le contexte anonyme", async () => {
      await anon.dispose();
    });
  });
});
