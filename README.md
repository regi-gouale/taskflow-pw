# taskflow-pw

Projet de tests end-to-end Playwright pour Taskflow.

## Installation

```bash
bun install
```

## Lancer les tests E2E

```bash
bun run test
```

Variantes utiles :

```bash
bun run test:headed
bun run test:ui
bun run test:debug
```

Les tests génèrent aussi des résultats Allure dans `allure-results/`.
Pour ouvrir un rapport HTML Allure après une exécution :

```bash
bun run allure:report
```

## Lancer les tests API

Configuration minimale (optionnelle mais recommandee) :

```bash
export APP_BASE_URL="https://taskflow.gouale.com"
export API_BASE_URL="https://taskflow.gouale.com"
export API_SIGN_UP_PATH="/api/auth/sign-up"
export API_SIGN_IN_PATH="/api/auth/sign-in"
```

Puis lancer :

```bash
bun run test:api
```

Notes :

- Le projet Playwright `chromium` ignore `tests/api/**`.
- Le projet Playwright `api` execute uniquement `tests/api/**/*.spec.ts`.
- Le test d'exemple API est desactive tant que `API_SIGN_UP_PATH` et `API_SIGN_IN_PATH` ne sont pas definies.

## Important avec Bun

Ne pas utiliser `bun test` pour ce projet.

- `bun test` lance le runner de tests Bun.
- Nos fichiers `tests/*.spec.ts` utilisent le runner Playwright.
- Le bon usage est `bun run test` (script Playwright défini dans `package.json`).

## Allure

Le projet est configuré avec `allure-playwright` dans `playwright.config.ts`.

Commandes utiles :

```bash
bun run test
bun run allure:generate
bun run allure:open
```
