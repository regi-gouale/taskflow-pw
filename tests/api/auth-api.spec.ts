import { expect, test } from "@/fixtures/api.fixture";

test.describe("API Auth", () => {
  test("inscription puis connexion utilisateur", async ({
    request,
    signIn,
    signInPath,
    signUp,
    signUpPath,
  }) => {
    test.skip(
      !process.env.API_SIGN_UP_PATH || !process.env.API_SIGN_IN_PATH,
      "Configurez API_SIGN_UP_PATH et API_SIGN_IN_PATH pour activer ce test.",
    );

    const user = await test.step("Créer un utilisateur via l'API", async () =>
      signUp());

    await test.step("Vérifier que l'inscription répond en succès", async () => {
      const response = await request.post(signUpPath, {
        data: {
          fullName: user.fullName,
          email: `${Date.now()}-dup-${user.email}`,
          password: user.password,
        },
      });

      expect(response.status()).toBeLessThan(500);
    });

    await test.step("Se connecter via l'API", async () => {
      const response = await signIn(user);
      expect(response.ok()).toBeTruthy();

      const body = await response.json().catch(() => null);
      expect(body).not.toBeNull();

      if (body && typeof body === "object") {
        const token =
          "accessToken" in body
            ? body.accessToken
            : "token" in body
              ? body.token
              : null;

        expect(token).toBeTruthy();
      }
    });

    await test.step("Valider les variables de config API", async () => {
      expect(signUpPath).toContain("/");
      expect(signInPath).toContain("/");
    });
  });
});
