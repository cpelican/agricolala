# Agent Instructions

Next.js 16 + React 19 vineyard treatments app (Prisma, PostgreSQL, NextAuth, Vercel). Setup: [readme.md](readme.md) · E2e: [e2e/TESTING.md](e2e/TESTING.md) · CI: [.github/workflows/test.yml](.github/workflows/test.yml).

## Environment

| Where | Dev DB | Vitest / integration | E2e (`E2E_DB_SETUP`) |
|-------|--------|----------------------|----------------------|
| **Local** | `agraria` @ `5435` | `agraria` @ `5433` | unset → `docker` @ `5434`; `global-setup.ts` migrates or `setup-e2e-db.sh` |
| **Cursor Cloud** | `agraria` @ `5432` | `agraria_test` @ `5432` | `native` / `test:e2e:agent` → `agraria_e2e` socket; `setup-e2e-native.sh` |
| **CI** | — | PG `5433` | unset → service Postgres @ `5434` |

`E2E_DATABASE_URL` override (port **5434**; native: `?host=/var/run/postgresql`). `E2E_POSTGRES_USER` / `E2E_POSTGRES_DB` native. `test:e2e:db:start` optional local; not Cloud.
`.env` / `.env.test` gitignored; `.env.test` optional — defaults in `test/load-test-env.ts`. Vitest DB user superuser (`session_replication_role`).

## Commands

**Integration tests = Vitest + DB.** Recipe: `npm run test:db:start && npm run test`
- Local `test:db:start` first: Docker PG @ `5433`, `migrate deploy`, `prisma generate`; **wipes test DB**; `--remove-orphans` may stop e2e compose containers
- Vitest `globalSetup` boots Next on **3001** (HTTP integration tests hit this server)
- Integration-only (2 files): `npm run test -- app/api/cron/suggest-treatments/route-suggest-treatments.test.ts lib/update-substance-aggregations.test.ts`
- E2e only: failures → `test-results/`, `playwright-report/` (Vitest = console only)

| Task | Command |
|------|---------|
| Dev | `npm run dev` → `http://localhost:3000` |
| Migrate | `npx prisma migrate dev` |
| Seed (dev; wipes ref data) | `npm run seed` |
| Typecheck | `npm run tsc` |
| Lint + format | `npm run precommit` |
| Vitest (all) | `npm run test` |
| Vitest (one file) | `npm run test -- path/to/file.test.ts` |
| Vitest DB (local) | `npm run test:db:start` / `test:db:stop` |
| E2e | `npm run test:e2e` (**127.0.0.1:3002**, mobile, `/en`) · optional `test:e2e:db:start` · cloud `test:e2e:agent` · record: [TESTING.md](e2e/TESTING.md#ux-change-workflow) |
| E2e install | `npm run test:e2e:install` |
| Prisma Studio | `npm run studio` |

## Before finishing

- **API / lib / server:** integration tests above (local: `test:db:start` first).
- **UI / auth / parcels / treatments / dashboard:** e2e per Environment.
- **UX change:** [TESTING.md workflow](e2e/TESTING.md#ux-change-workflow).
- Report commands run + pass/fail.

## Authentication

- Credentials only `/auth/signin` — no other providers.
- Dev: `TEST_USER_EMAIL`, `TEST_USER_PASSWORD`, `NEXTAUTH_SECRET` in `.env` (readme).
- E2e: `playwright@agricolala.test` / `playwright-local-password`.
