# Agent Instructions

Next.js 16 + React 19 vineyard treatments app (Prisma, PostgreSQL, NextAuth, Vercel). Setup: [readme.md](readme.md) · E2e: [e2e/TESTING.md](e2e/TESTING.md) · CI: [.github/workflows/test.yml](.github/workflows/test.yml).

## Environment

Vitest local: `test:db:start` first (Next **3001**, `.env.test`). E2e: `npm run test:e2e` (**127.0.0.1:3002**, mobile, `/en`). Failures: `test-results/`, `playwright-report/`.

| Where | Dev DB | Vitest | E2e (`E2E_DB_SETUP`) |
|-------|--------|--------|----------------------|
| **Local** | `agraria` @ `5435` | `agraria` @ `5433` | unset → `docker`, Postgres @ `5434`; `global-setup.ts` migrates or runs `setup-e2e-db.sh` |
| **Cloud Agent** | `agraria` @ `5432` | `agraria_test` @ `5432` | `native` (or `test:e2e:agent`) → `agraria_e2e` via socket; `setup-e2e-native.sh` |
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

`npm run dev` auto-runs `predev` (`scripts/kill-dev-lock.sh`), which kills a stale `next dev` process left over from a prior session (via its `.next/dev/lock` PID) and frees the default port. This runs unprompted — the agent is pre-authorized to kill stale local `next dev` processes as part of starting the dev server for preview/verification.

## Before finishing

- **API / lib / server:** integration tests above (local: `test:db:start` first).
- **UI / auth / parcels / treatments / dashboard:** e2e per Environment.
- **UX change:** [TESTING.md workflow](e2e/TESTING.md#ux-change-workflow).
- Report commands run + pass/fail.

## Authentication

- Credentials only `/auth/signin` — no other providers.
- Dev: `TEST_USER_EMAIL`, `TEST_USER_PASSWORD`, `NEXTAUTH_SECRET` in `.env` (readme).
- E2e: `playwright@agricolala.test` / `playwright-local-password`.

## Main Rules for development

### TypeScript: type guards, not coercive assertions

- Do **not** use `as SomeType` (or `as unknown as ...`) to force a value into a type. That hides mistakes and fights the checker.
- **Prefer** narrowing the type checker can follow: [type predicates](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#using-type-predicates) (`function isFoo(x): x is Foo`), checks with `in` / `instanceof`, discriminated unions, and runtime validation (e.g. Zod) with inferred types.
- **OK:** `as const` for literal/tuples, and `satisfies` to check excess properties without erasing a inferred type.

### TypeScript: Prisma types first — avoid duplicate shapes

- For anything that reflects **database fields or query results**, **do not** invent parallel `interface` / `type` definitions that repeat the same property names and semantics as Prisma models.
- **Prefer** types from **`@prisma/client`**: models, enums, and `Prisma` namespace helpers (e.g. `Prisma.ModelGetPayload`, `Prisma.XxxArgs`).
- **Compose** with `Pick`, `Omit`, and `ReturnType` / `Awaited<ReturnType<typeof someQuery>>` so the compiler stays tied to the schema. If you need a subset, derive it from the model or from a named `select` payload type instead of a hand-written duplicate.
- **Zod (or similar)** is fine for runtime validation and forms; use **`z.infer<typeof schema>`** as the TS type so you still have a single definition, not a second interface that mirrors the same fields.
- **OK:** small **UI-only** props (e.g. `isOpen`, `onClose`) that are not meant to mirror DB rows.

### Database migrations (Prisma)

- Do **not** add or edit SQL under `prisma/migrations/` by hand when implementing schema changes, unless someone explicitly asks for a custom/manual migration.
- After changing `prisma/schema.prisma`, create migrations with the Prisma CLI, for example:

  `npx prisma migrate dev --name <short_description>`

  so the migration matches what Prisma generates and stays reviewable.
- If you only update the schema file, tell the user to run `migrate dev` (or run it in the project when appropriate) instead of authoring new migration files from scratch.
