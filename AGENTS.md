# Agent Instructions

Next.js 16 + React 19 vineyard treatments app (Prisma, PostgreSQL, NextAuth, Vercel). Human setup: [readme.md](readme.md).

## External References

| Need | File |
|------|------|
| Setup & env ports | [readme.md](readme.md) |
| Playwright layout, waits, demos, selectors | [e2e/TESTING.md](e2e/TESTING.md) |
| CI jobs & ports | [.github/workflows/test.yml](.github/workflows/test.yml) |

## Environment

| Where | Dev DB | Vitest | E2e |
|-------|--------|--------|-----|
| **Cursor Cloud** | `agraria` @ `5432` (native PG 16) | `agraria_test` @ `5432` | `agraria_e2e` @ `5432` — `npm run test:e2e:agent` |
| **Local** | `agraria` @ `5435` (`docker compose up`) | `agraria` @ `5433` — `npm run test:db:start` first | `agraria` @ `5434` — `npm run test:e2e:db:start` first |
| **CI** | — | Postgres @ `5433`, `npm run test` | Postgres @ `5434`, `npm run test:e2e` |

- Cloud: `sudo pg_ctlcluster 16 main start` before migrate/test.
- Do **not** use `test:e2e:agent` locally or `test:e2e:db:start` in Cloud.
- `.env` / `.env.test` gitignored; DB user needs **superuser** for Vitest (`session_replication_role`).

## Commands

| Task | Command |
|------|---------|
| Dev | `npm run dev` → `http://localhost:3000` |
| Migrate | `npx prisma migrate dev` |
| Seed (dev only; wipes ref data) | `npm run seed` |
| Typecheck | `npm run tsc` |
| Lint + format | `npm run precommit` |
| Vitest (all) | `npm run test` |
| Vitest (one file) | `npm run test -- path/to/file.test.ts` |
| Vitest DB (local) | `npm run test:db:start` / `npm run test:db:stop` |
| E2e install | `npm run test:e2e:install` |
| E2e specs (local/CI) | `npm run test:e2e:db:start` then `npm run test:e2e` |
| E2e (Cloud) | `npm run test:e2e:agent` |
| E2e walkthrough video | `npm run test:e2e:record` |
| Prisma Studio | `npm run studio` |

Vitest: Next on **3001** (`.env.test`). E2e: **127.0.0.1:3002**, mobile viewport, English `/en`. On failure: `test-results/`, `playwright-report/`.

## Before finishing

- **API / lib / server:** `npm run test` (local: `test:db:start` first).
- **UI / auth / parcels / treatments / dashboard:** e2e per environment above.
- **UX change:** [e2e/TESTING.md](e2e/TESTING.md) — update/add `e2e/*.spec.ts` and `e2e/flows/`, run `npm run test:e2e`, then `npm run test:e2e:record` and share `test-results/demo-videos/<spec-slug>.webm`.
- Report which commands you ran and pass/fail.

## Authentication

- **Credentials only** at `/auth/signin` — do not enable other sign-in providers.
- Dev: `TEST_USER_EMAIL`, `TEST_USER_PASSWORD`, `NEXTAUTH_SECRET` in `.env` (see readme).
- E2e: `playwright@agricolala.test` / `playwright-local-password` (not dev creds).
