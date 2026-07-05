import type { Page } from "@playwright/test";
import { networkInterceptionFactory } from "@/factories/network-interception.factory";
import { expect, test } from "@/fixtures/page.fixture";

type FetchResult = {
  ok: boolean;
  status: number;
  text: string;
};

const mockEndpoint = "/api/network-mocks/sign-in";

const mockEndpointCases = networkInterceptionFactory.buildMockEndpointCases();

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

  for (const networkCase of mockEndpointCases) {
    test(networkCase.title, async ({ page }) => {
      let intercepted = false;

      await page.route(`**${mockEndpoint}`, async (route) => {
        intercepted = true;

        if (networkCase.action === "blocked") {
          await route.abort("blockedbyclient");
          return;
        }

        if (networkCase.action === "slow-network") {
          await new Promise((resolve) => {
            setTimeout(resolve, networkCase.delayMs ?? 1200);
          });
        }

        await route.fulfill({
          status: networkCase.responseStatus ?? 500,
          contentType: "application/json",
          body: JSON.stringify(networkCase.responseBody ?? {}),
        });
      });

      if (networkCase.action === "server-error") {
        const response = await fetchMockedEndpoint(page);

        await test.step("Verifier la reponse mockee", async () => {
          expect(response.status).toBe(networkCase.expectedStatus);
          expect(response.ok).toBe(networkCase.expectedOk);
          expect(JSON.parse(response.text)).toEqual(
            networkCase.expectedResponseBody,
          );
        });
        return;
      }

      if (networkCase.action === "slow-network") {
        const elapsed = await page.evaluate(
          async ({ endpoint, email }) => {
            const startedAt = performance.now();

            await fetch(endpoint, {
              method: "POST",
              headers: {
                "content-type": "application/json",
              },
              body: JSON.stringify({ email }),
            });

            return performance.now() - startedAt;
          },
          {
            endpoint: mockEndpoint,
            email: networkCase.requestEmail,
          },
        );

        await test.step("Verifier que l'appel a ete retarde", async () => {
          expect(elapsed).toBeGreaterThanOrEqual(
            networkCase.minElapsedMs ?? 1100,
          );
        });
        return;
      }

      const failure = await page.evaluate(
        async ({ endpoint, email }) => {
          try {
            await fetch(endpoint, {
              method: "POST",
              headers: {
                "content-type": "application/json",
              },
              body: JSON.stringify({ email }),
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
        },
        {
          endpoint: mockEndpoint,
          email: networkCase.requestEmail,
        },
      );

      await test.step("Verifier que la requete a bien ete interceptee", async () => {
        expect(intercepted).toBe(true);
        expect(failure).not.toBeNull();
        expect(failure?.name).toBe(networkCase.expectedFailureName);
      });
    });
  }
});
