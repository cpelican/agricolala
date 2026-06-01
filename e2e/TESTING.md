# E2e testing (Playwright)

Mobile-only UI tests. Env, DB ports, and npm commands: [AGENTS.md](../AGENTS.md).

## Layout

| Layer | Path | CI |
|-------|------|-----|
| Shared steps | `e2e/flows/*.ts` | — |
| Demo video | `e2e/demos/*.demo.ts` | no |
| Regression | `e2e/*.spec.ts` | yes |

Projects in [`playwright.config.ts`](../playwright.config.ts): `setup` → `auth.setup.ts` → `e2e/.auth/user.json`; `mobile-chromium` (specs); `demo` (videos only).

## Support modules

| Use | File |
|-----|------|
| Dashboard loaded / no errors | `e2e/support/assertions.ts` |
| Bottom nav click | `e2e/support/navigation.ts` |
| Parcel / treatment dialogs | `e2e/support/add-parcel.ts`, `add-treatment.ts` |
| Chart assertions | `e2e/support/chart.ts` |
| Seed + login | `e2e/support/demo-auth.ts`, `e2e-data.ts` |
| Demo output path | `e2e/support/demo-video.ts` |
| Map label constant | `e2e/support/map.ts` |

## Waits

- **No** `page.waitForTimeout()`.
- Use `expect(…).toBeVisible()` / `toBeHidden()`; reuse `expectDashboardLoaded(page)` from assertions.
- Demos use the **same** visibility waits as specs (see flows); video recording only adds `video: "on"` on the `demo` project.

## Selectors

1. `getByRole` (with `name`) → `getByLabel` → `getByPlaceholder` → visible text.
- **No** CSS/class locators when the component can get `role` / `aria-label` / `<label>` first (e.g. [`parcel-map.tsx`](../components/parcels/parcel-map.tsx) + `e2e/support/map.ts`).
- Avoid `getByTestId` unless accessibility cannot be improved.

## Rules

- `jest/no-conditional-in-test` on `*.test.ts`, `*.spec.ts`, `*.demo.ts` — split flows instead of `if` in tests.
- `workers: 1`, serial suites; shared seed in `auth.setup.ts`.
- Routes: English `/en` only.

## UX change workflow

1. Change UI.
2. Update `e2e/flows/<name>.ts`.
3. Add `e2e/demos/<name>.demo.ts` — export `demoSlug`; `saveDemoVideo` in `afterEach` ([`demos/README.md`](demos/README.md)).
4. `npm run test:e2e:demo` → share `test-results/demo-videos/<demoSlug>.webm`.
5. Add `e2e/*.spec.ts` **only when asked**.

## Commands (e2e only)

| Task | Command |
|------|---------|
| Install browser | `npm run test:e2e:install` |
| DB + specs (local) | `npm run test:e2e:db:start` then `npm run test:e2e` |
| Specs (Cloud) | `npm run test:e2e:agent` |
| Demo video | `npm run test:e2e:demo` |
| One spec | `npx playwright test e2e/dashboard.spec.ts --project=mobile-chromium` |

Login: `playwright@agricolala.test` / `playwright-local-password`. App: **127.0.0.1:3002**.
