# E2e (Playwright)

Mobile-only UI tests. Env & commands: [AGENTS.md](../AGENTS.md#environment).

## Layout

| Layer | Path | CI |
|-------|------|-----|
| Flows | `e2e/flows/*.ts` | — |
| Specs | `e2e/*.spec.ts` | yes |

[`playwright.config.ts`](../playwright.config.ts): `global-setup.ts` → `auth.setup.ts` → `.auth/user.json`; project `mobile-chromium`. Specs: `import { test, expect } from "./support/test"`.

## Support

`e2e/support/` — `test.ts` plus helpers (`add-parcel`, `add-treatment`, `navigation`, `assertions`, `chart`, `map`, `parcels-map`, `demo-auth`).

## Support

`e2e/support/` — import `test`/`expect` from `test.ts`; flows use `add-parcel.ts`, `add-treatment.ts`, `navigation.ts`, `assertions.ts`, `chart.ts`, `map.ts`, `demo-auth.ts`.

## Recording

`PLAYWRIGHT_RECORD_DEMO=1` → video; `test.ts` copies to `test-results/demo-videos/<spec-slug>.webm`.

| Task | Command |
|------|---------|
| All (default spec) | `npm run test:e2e:record` |
| One spec | `PLAYWRIGHT_RECORD_DEMO=1 npx playwright test e2e/<spec>.spec.ts --project=mobile-chromium` |
| Iterate (no video) | `npx playwright test e2e/<spec>.spec.ts --project=mobile-chromium` |

## Waits & selectors

- No `waitForTimeout`; use `expect` visibility; `expectDashboardLoaded` = chart + no skeleton.
- Selectors: `getByRole` (name) → `getByLabel` → `getByPlaceholder` → text; map labels in `map.ts`. Avoid `getByTestId`.

## Rules

- No conditionals in `test()`; branch in flows; record via env only.
- **Independent tests:** each spec resets DB, `afterEach` → idle home; pass in any order.
- `workers: 1`; serial only when one file shares a journey; seed in `auth.setup.ts`; `/en` only.

## UX change workflow

User-visible flow change → mandatory demo `.webm` (do not skip after green specs). Styling-only → `test:e2e` per AGENTS.md, skip record.

1. Change UI.
2. Update `e2e/flows/*.ts` and `e2e/*.spec.ts`.
3. `npm run test:e2e` (`global-setup` boots DB; `test:e2e:db:start` optional locally).
4. `npm run test:e2e:record` → share `test-results/demo-videos/<spec-slug>.webm`.
