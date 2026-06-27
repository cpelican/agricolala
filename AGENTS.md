# Agent Instructions

Next.js 16 + React 19 vineyard treatments app (Prisma, PostgreSQL, NextAuth, Vercel). Setup: [readme.md](readme.md) · E2e detail: [e2e/TESTING.md](e2e/TESTING.md) · CI: [.github/workflows/test.yml](.github/workflows/test.yml).

## Environment

Vitest local: `test:db:start` first (Next **3001**, `.env.test`). E2e: `npm run test:e2e` (**127.0.0.1:3002**, mobile, `/en`). Failures: `test-results/`, `playwright-report/`.

| Where | Dev DB | Vitest | E2e (`E2E_DB_SETUP`) |
|-------|--------|--------|----------------------|
| **Local** | `agraria` @ `5435` | `agraria` @ `5433` | unset → `docker`, Postgres @ `5434`; `global-setup.ts` migrates or runs `setup-e2e-db.sh` |
| **Cloud Agent** | `agraria` @ `5432` | `agraria_test` @ `5432` | `native` (or `test:e2e:agent`) → `agraria_e2e` via socket; `setup-e2e-native.sh` |
| **CI** | — | PG `5433` | unset → service Postgres @ `5434` |

`E2E_DATABASE_URL` optional override (port **5434**; native adds `?host=/var/run/postgresql`). `E2E_POSTGRES_USER` / `E2E_POSTGRES_DB` for native. `test:e2e:db:start` optional locally; not in Cloud.
- `.env` / `.env.test` gitignored; Vitest DB user **superuser** (`session_replication_role`).

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
| Vitest DB (local) | `npm run test:db:start` / `test:db:stop` |
| E2e | `npm run test:e2e` · optional `test:e2e:db:start` · cloud `test:e2e:agent` · record: [TESTING.md](e2e/TESTING.md) |
| E2e install | `npm run test:e2e:install` |
| Prisma Studio | `npm run studio` |

## Before finishing

- **API / lib / server:** `npm run test` (local: `test:db:start` first).
- **UI / auth / parcels / treatments / dashboard:** e2e per Environment above.
- **UX change:** [TESTING.md workflow](e2e/TESTING.md#ux-change-workflow).
- Report commands run and pass/fail.

## Authentication

- **Credentials only** at `/auth/signin` — no other providers.
- Dev: `TEST_USER_EMAIL`, `TEST_USER_PASSWORD`, `NEXTAUTH_SECRET` in `.env` (readme).
- E2e: `playwright@agricolala.test` / `playwright-local-password`.
