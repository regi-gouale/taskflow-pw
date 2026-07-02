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

## Important avec Bun

Ne pas utiliser `bun test` pour ce projet.

- `bun test` lance le runner de tests Bun.
- Nos fichiers `tests/*.spec.ts` utilisent le runner Playwright.
- Le bon usage est `bun run test` (script Playwright défini dans `package.json`).
