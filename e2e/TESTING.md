# E2e testing (Playwright)

Mobile-only UI tests. Env, DB ports, npm commands: [AGENTS.md](../AGENTS.md).

## Layout

| Layer | Path | CI |
|-------|------|-----|
| Shared steps | `e2e/flows/*.ts` | — |
| Regression | `e2e/*.spec.ts` | yes |

[`playwright.config.ts`](../playwright.config.ts): `setup` → `e2e/auth.setup.ts` → `e2e/.auth/user.json`; `mobile-chromium` (all `*.spec.ts`).

## Support modules

| Use | File |
|-----|------|
| `test` / `expect` (+ demo `afterEach`) | `e2e/support/test.ts` |
| Dashboard / errors | `e2e/support/assertions.ts` |
| Bottom nav | `e2e/support/navigation.ts` |
| Parcel / treatment | `e2e/support/add-parcel.ts`, `add-treatment.ts` |
| Chart | `e2e/support/chart.ts` |
| Seed + login | `e2e/support/demo-auth.ts`, `e2e-data.ts` |
| Video copy | `e2e/support/demo-video.ts` |
| Map label | `e2e/support/map.ts` |

Specs: `import { test, expect } from "./support/test"` (not `@playwright/test`).

## Recording

`PLAYWRIGHT_RECORD_DEMO=1` turns on video; `e2e/support/test.ts` copies to `test-results/demo-videos/<spec-slug>.webm`.

| Task | Command |
|------|---------|
| Default recording | `npm run test:e2e:record` (`treatments-nav.spec.ts`) |
| One spec | `PLAYWRIGHT_RECORD_DEMO=1 npx playwright test e2e/parcels-nav.spec.ts --project=mobile-chromium` |

## Waits & selectors

- **No** `page.waitForTimeout()`; use `expect(…).toBeVisible()` / `toBeHidden()`; `expectDashboardLoaded(page)` checks chart + no skeleton.
- Selectors: `getByRole` (name) → `getByLabel` → `getByPlaceholder` → text. No CSS hooks if the component can expose `role` / `aria-label` (see [`parcel-map.tsx`](../components/parcels/parcel-map.tsx), `e2e/support/map.ts`). Avoid `getByTestId` unless necessary.

## Rules

- `jest/no-conditional-in-test` on `*.test.ts`, `*.spec.ts` — branch in flows, not inside `test()`; recording only via env/config.
- `workers: 1`, serial suites; seed in `auth.setup.ts`. Routes: `/en` only.

## UX change workflow

1. Change UI.
2. Update `e2e/flows/*.ts` and `e2e/*.spec.ts` (reuse flows when possible).
3. `npm run test:e2e` (local: `test:e2e:db:start` first).
4. `npm run test:e2e:record` → share `test-results/demo-videos/treatments-nav.webm` (or your spec’s slug).

## Commands

| Task | Command |
|------|---------|
| One spec | `npx playwright test e2e/dashboard.spec.ts --project=mobile-chromium` |

Other e2e commands: [AGENTS.md](../AGENTS.md). Login: `playwright@agricolala.test` / `playwright-local-password`. App: **127.0.0.1:3002**.
