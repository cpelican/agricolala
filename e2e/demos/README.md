# User-flow demos (`*.demo.ts`)

Record **mobile** walkthrough videos while implementing UX changes. Demos are **not** CI e2e tests.

Full conventions and waits: **[`../TESTING.md`](../TESTING.md)**.

## Quick steps

1. Update `e2e/flows/<name>.ts` (visibility waits, no `waitForTimeout`).
2. Add `e2e/demos/<name>.demo.ts` calling the flow; export `demoSlug`; `saveDemoVideo` in `afterEach`.
3. `npm run test:e2e:demo` → share `test-results/demo-videos/<demoSlug>.webm`.
