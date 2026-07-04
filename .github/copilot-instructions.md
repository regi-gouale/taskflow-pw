# Copilot Instructions — taskflow-pw

## Contexte du projet

Suite de tests end-to-end (E2E) **Playwright** pour l'application **Taskflow**.  
Langage : **TypeScript strict**. Runtime : **Bun**. Linter/formatter : **Biome**.  
Rapports : **Allure v3** (`allure` package, pas v2).

---

## Architecture

```
tests/          # Specs organisées par domaine (auth, tasks, projects, team, api, network)
pages/          # Page Object Models (POM) — un fichier par page
fixtures/       # Extensions Playwright test (page.fixture.ts, test-data.fixture.ts, api.fixture.ts)
factories/      # Factories de données de test avec @faker-js/faker
utils/          # global-setup.ts (auth Allure executor)
playwright/     # État d'authentification persisté (.auth/user.json)
```

### Import alias

Utiliser `@/` (alias racine) dans tous les imports :

```ts
import { SignInPage } from "@/pages";
import { test } from "@/fixtures/page.fixture";
```

---

## Règles pour les tests

### Toujours importer `test` depuis les fixtures du projet

```ts
// ✅ Correct
import { test, expect } from "@/fixtures/page.fixture";

// ❌ Jamais directement depuis Playwright
import { test } from "@playwright/test";
```

### Locators — priorité stricte

1. `getByRole()` — préféré pour les éléments interactifs
2. `getByTestId()` — pour les éléments sans rôle sémantique clair
3. `getByLabel()` — pour les champs de formulaire
4. `getByText()` — en dernier recours, **jamais** `{ exact: true }` sur des titres partagés avec des boutons

```ts
// ✅ Non-ambigu
page.getByRole("button", { name: "Se connecter" });
page.getByTestId("new-task-button");

// ❌ Ambigu (texte présent aussi dans le bouton de navigation)
page.getByText("Se connecter", { exact: true });
```

### Données de test — utiliser les factories

```ts
// ✅ Via fixture testData
const user = testData.user({ email: "custom@test.com" });
const members = testData.teamMembers(3);

// ❌ Jamais en dur dans les specs
const user = { email: "test@example.com", password: "abc123" };
```

### Page Objects

- Chaque méthode d'action retourne `Promise<void>`
- Les getters de locators sont des `get` TypeScript (non `async`)
- Toujours implémenter `expectLoaded()` pour vérifier que la page est chargée

```ts
export class MyPage {
  constructor(private readonly page: Page) {}

  get heading(): Locator {
    return this.page.getByRole("heading", { name: "Titre" });
  }

  async expectLoaded(): Promise<void> {
    await expect(this.heading).toBeVisible();
  }
}
```

---

## Variables d'environnement

Chargées via `dotenv/config` (déjà importé dans `playwright.config.ts` et `global-setup.ts`).

| Variable            | Description                              |
|---------------------|------------------------------------------|
| `APP_BASE_URL`      | URL de l'app (défaut: `http://localhost:3000`) |
| `API_BASE_URL`      | URL API pour les tests `api` project     |
| `E2E_EMAIL`         | Email du compte de test                  |
| `E2E_PASSWORD`      | Mot de passe du compte de test           |
| `ALLURE_BUILD_ORDER`| Ordre de build pour l'historique Allure  |
| `CI_JOB_URL`        | URL du job CI (optionnel)                |

---

## Scripts disponibles

```bash
bun test                    # Tous les tests (chromium + api)
bun test:ui-only            # Tests UI uniquement (chromium)
bun test:api                # Tests API uniquement
bun test:headed             # Navigateur visible
bun test:ui                 # Interface Playwright interactive
bun test:allure             # Tests + génération rapport Allure
bun run allure:report       # Générer et ouvrir le rapport Allure
bun check:fix               # Lint + format auto (Biome)
```

---

## Rapports Allure v3

- Package : `allure` (v3), **pas** `@allure-framework/allure-playwright`
- Historique : fichier `allure-history/history.jsonl` (format v3, pas dossier `history/`)
- Commandes de génération :

```bash
allure awesome ./allure-results -o ./allure-report \
  --report-name "Taskflow E2E" \
  --history-path ./allure-history/history.jsonl \
  --lang fr

allure history ./allure-results \
  --history-path ./allure-history/history.jsonl
```

---

## Pièges connus

- **Drag-and-drop board** : le drag Playwright peut ne pas déclencher la mutation. Prévoir un fallback via l'édition du statut dans le formulaire.
- **testid `section-IN_PROGRESS`** : n'existe pas dans le DOM de prod. Ne pas s'en servir pour localiser les colonnes du board.
- **Authentification** : si `/dashboard` redirige vers `/sign-in`, la fixture `authenticatedPage` régénère automatiquement la session et sauvegarde le `storageState`.
- **Allure history** : ne pas confondre avec le dossier `history/` de Allure v2 ; utiliser uniquement `--history-path` avec `.jsonl`.

---

## Conventions TypeScript / Biome

- Indentation : **2 espaces**
- `strict: true` + `noUncheckedIndexedAccess: true`
- Pas de `any` implicite
- `verbatimModuleSyntax: true` — utiliser `import type` pour les types
- Les `biome-ignore` sont acceptables uniquement pour les contraintes Playwright (ex. destructuring vide des fixtures)
