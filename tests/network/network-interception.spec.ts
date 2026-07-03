import type { Page } from "@playwright/test";
import { expect, test } from "@/fixtures/page.fixture";

type FetchResult = {
  ok: boolean;
  status: number;
  text: string;
};

const mockEndpoint = "/api/network-mocks/sign-in";

const fetchMockedEndpoint = async (page: Page): Promise<FetchResult> => {
  return page.evaluate(async (endpoint) => {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({ email: "test@taskflow.dev" }),
    });

    return {
      ok: response.ok,
      status: response.status,
      text: await response.text(),
    };
  }, mockEndpoint);
};

test.use({ storageState: { cookies: [], origins: [] } });

test.describe("Interceptions réseau", () => {
  test.beforeEach(async ({ signInPage }) => {
    await signInPage.goto();
    await signInPage.expectLoaded();
  });

  test.afterEach(async ({ page }) => {
    await page.context().clearCookies();
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test("simule une erreur serveur avec un mock de réponse", async ({
    page,
  }) => {
    await page.route(`**${mockEndpoint}`, async (route) => {
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({
          ok: false,
          message: "Internal Server Error",
        }),
      });
    });

    const response = await fetchMockedEndpoint(page);

    await test.step("Verifier la reponse mockee", async () => {
      expect(response.status).toBe(500);
      expect(response.ok).toBe(false);
      expect(JSON.parse(response.text)).toEqual({
        ok: false,
        message: "Internal Server Error",
      });
    });
  });

  test("simule un reseau lent avant de renvoyer la reponse", async ({
    page,
  }) => {
    await page.route(`**${mockEndpoint}`, async (route) => {
      await new Promise((resolve) => {
        setTimeout(resolve, 1200);
      });

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          ok: true,
        }),
      });
    });

    const elapsed = await page.evaluate(async (endpoint) => {
      const startedAt = performance.now();

      await fetch(endpoint, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ email: "slow@test.com" }),
      });

      return performance.now() - startedAt;
    }, mockEndpoint);

    await test.step("Verifier que l'appel a ete retarde", async () => {
      expect(elapsed).toBeGreaterThanOrEqual(1100);
    });
  });

  test("bloque une requete avec abort", async ({ page }) => {
    let intercepted = false;

    await page.route(`**${mockEndpoint}`, async (route) => {
      intercepted = true;
      await route.abort("blockedbyclient");
    });

    const failure = await page.evaluate(async (endpoint) => {
      try {
        await fetch(endpoint, {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({ email: "blocked@test.com" }),
        });

        return null;
      } catch (error) {
        if (error instanceof Error) {
          return {
            name: error.name,
            message: error.message,
          };
        }

        return {
          name: "UnknownError",
          message: String(error),
        };
      }
    }, mockEndpoint);

    await test.step("Verifier que la requete a bien ete interceptee", async () => {
      expect(intercepted).toBe(true);
      expect(failure).not.toBeNull();
      expect(failure?.name).toBe("TypeError");
    });
  });
});
