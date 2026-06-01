# User-flow demos (`*.demo.ts`)

Record **mobile** walkthrough videos while implementing UX changes. Demos are **not** CI e2e tests.

## Workflow

1. **Flow change** — Implement the UI change.
2. **Shared flow** — Add or update `e2e/flows/<name>.ts` (steps only, no assertions).
3. **Demo** — Add `e2e/demos/<name>.demo.ts` that calls the flow with `stepDelayMs` and exports `demoSlug`.
4. **Record** — `npm run test:e2e:demo` (or `npm run test:e2e:demo -- e2e/demos/<file>.demo.ts`).
5. **Deliver** — Share the path `test-results/demo-videos/<demoSlug>.webm` with the user.
6. **Promote to e2e** (when asked) — Add assertions in `e2e/agricolala.spec.ts` (or a new `*.spec.ts`) using the same flow; keep the demo for future recordings.

## Conventions

| Piece | Location |
|-------|----------|
| Steps (shared) | `e2e/flows/*.ts` |
| Video recording | `e2e/demos/*.demo.ts` |
| Assertions / CI | `e2e/*.spec.ts` |
| Helpers | `e2e/support/*` |

Demos use `ensureE2eAuthState` and `saveDemoVideo` from `e2e/support/`.
