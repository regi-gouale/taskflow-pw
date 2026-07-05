export interface SignInValidationCase {
  title: string;
  email: string;
  password: string;
}

export interface SignInNavigationCase {
  title: string;
  action: "sign-up" | "forgot-password";
  expectedUrl: RegExp;
  shouldAssertCreateAccountHeading: boolean;
}

export interface SignInNetworkCase {
  title: string;
  action: "server-error" | "slow-network" | "blocked";
  email: string;
  password: string;
  delayMs?: number;
  responseStatus?: number;
  responseBody?: Record<string, unknown>;
  shouldExpectInvalidCredentialsAlert: boolean;
}

class SignInTestCaseFactory {
  buildValidationCases(): ReadonlyArray<SignInValidationCase> {
    return [
      {
        title: "gère un email invalide",
        email: "email-invalide",
        password: "azertyuiop",
      },
      {
        title: "refuse une connexion quand les champs sont vides",
        email: "",
        password: "",
      },
    ];
  }

  buildNavigationCases(): ReadonlyArray<SignInNavigationCase> {
    return [
      {
        title: "fournit la navigation vers la page d'inscription",
        action: "sign-up",
        expectedUrl: /\/sign-up$/,
        shouldAssertCreateAccountHeading: true,
      },
      {
        title: "fournit la navigation vers mot de passe oublié",
        action: "forgot-password",
        expectedUrl: /\/forgot-password$/,
        shouldAssertCreateAccountHeading: false,
      },
    ];
  }

  buildNetworkCases(): ReadonlyArray<SignInNetworkCase> {
    return [
      {
        title: "simule une erreur serveur lors de la connexion",
        action: "server-error",
        email: "server-error@test.com",
        password: "Password123!",
        responseStatus: 500,
        responseBody: {
          ok: false,
          message: "Internal Server Error",
        },
        shouldExpectInvalidCredentialsAlert: false,
      },
      {
        title: "simule un réseau lent lors de la connexion",
        action: "slow-network",
        email: "slow-network@test.com",
        password: "wrong-password",
        delayMs: 1200,
        responseStatus: 401,
        responseBody: {
          error: "Invalid email or password",
        },
        shouldExpectInvalidCredentialsAlert: true,
      },
      {
        title: "bloque la requête de connexion",
        action: "blocked",
        email: "blocked@test.com",
        password: "Password123!",
        shouldExpectInvalidCredentialsAlert: false,
      },
    ];
  }
}

export const signInTestCaseFactory = new SignInTestCaseFactory();
