# AGENTS.md

Instructions for **AI coding agents** in this repo (**Cursor Cloud** or **local Cursor/IDE**). Step-by-step human setup: [readme.md](readme.md).

## Choose your environment

| Where you run | Dev database | Vitest | Playwright e2e |
|---------------|--------------|--------|----------------|
| **Cursor Cloud** | Native PG 16, `agraria` @ `5432` | `npm run test` → `agraria_test` @ `5432` | `npm run test:e2e:agent` → `agraria_e2e` — **no Docker** |
| **Local** | `docker compose up` → `agraria` @ `5435` | `npm run test:db:start` → `5433`; then `npm run test` | `test:e2e:db:start` → `npm run test:e2e` → `test:e2e:db:stop` |

**CI** (`.github/workflows/test.yml`, same ports as **Local** Docker):

- **Vitest job:** Postgres 15 service on `5433`, `npm run test` (no `test:db:start` script)
- **E2e job:** Postgres 15 service on `5434`, `npm run test:e2e`

### Which row am I?

| You are… | Row |
|----------|-----|
| Agent in **Cursor Cloud** (remote Linux VM, no Docker for Postgres) | **Cursor Cloud** |
| Agent or dev on a **local machine** (laptop/desktop; use Docker Compose per readme) | **Local** |
| Debugging a **GitHub Actions** failure | **Local** ports/commands above |

Do not use `test:e2e:agent` on a local Docker setup, or `test:e2e:db:start` in Cursor Cloud.

## Ports and databases

| Purpose | App URL | Cursor Cloud (native) | Local (Docker) |
|--------|---------|----------------------|----------------|
| Dev | `http://localhost:3000` | `agraria` @ `5432` | `agraria` @ `5435` |
| Vitest | `http://localhost:3001` | `agraria_test` @ `5432` | `agraria` @ `5433` |
| Playwright e2e | `http://127.0.0.1:3002` | `agraria_e2e` @ socket `5432` | `agraria` @ `5434` |

`.env` and `.env.test` are gitignored. **Cloud:** use `5432` URLs. **Local:** use `5435` / `5433` as in [readme.md](readme.md).

## Before finishing a task

- **API / lib / server logic:** `npm run test` (local: run `npm run test:db:start` first)
- **UI, auth, parcels, treatments, dashboard charts:** e2e (commands below)
- **Optional:** `npm run tsc`, `npm run precommit`

**E2e — Cursor Cloud:**

```bash
npm run test:e2e:install
npm run test:e2e:agent
```

**E2e — local (matches CI):** run `test:e2e:db:start` before `test:e2e` (same shell).

```bash
npm run test:e2e:install
npm run test:e2e:db:start
npm run test:e2e
npm run test:e2e:db:stop   # optional cleanup
```

Report which commands you ran and whether they passed.

## Overview

Agricolala is a Next.js 16 + React 19 web app for managing vineyard treatments and tracking substance usage for organic EU compliance. Uses Prisma ORM with PostgreSQL, NextAuth, and is deployed on Vercel.

## Database

Integration tests may set `session_replication_role`; the DB user needs superuser (or equivalent).

**Cursor Cloud:** Native PostgreSQL **16** (no Docker — Docker Hub rate limits). Databases on `5432`: `agraria`, `agraria_test`, `agraria_e2e` (e2e DB created by `test:e2e:agent`). The `agraria` OS user should be a **superuser** (integration tests use `session_replication_role`).

```bash
sudo pg_ctlcluster 16 main start   # Linux; adjust on other OSes
```

**Local / CI:** Docker Postgres **15** images. Local: `docker compose up` (dev, `5435`). Vitest: `test:db:start` / `test:db:stop` (`5433`). E2e: `test:e2e:db:start` / `test:e2e:db:stop` (`5434`).

## Environment variables

- **Cloud:** `.env` / `.env.test` → `localhost:5432`
- **Local:** `.env` / `.env.test` → `5435` / `5433` (see readme)
- **E2e:** Playwright defaults in `playwright.config.ts`; Cloud overrides via `run-e2e-native.sh` (`agraria_e2e`)

## Starting the dev environment

**Cursor Cloud:**

```bash
sudo pg_ctlcluster 16 main start
npx prisma migrate dev
npm run dev
```

**Local:** `docker compose up`, then `npx prisma migrate dev`, `npm run seed`, `npm run dev` (readme).

Dev app: `http://localhost:3000` → `/auth/signin`.

## Common commands

- `npm run dev`, `npm run test`, `npm run lint`, `npm run tsc`, `npm run build`, `npm run studio`, `npm run precommit`
- `npm run seed` — reference data only; wipes products/substances/diseases on the DB in `.env` (dev), not test/e2e DBs
- `test:db:start` / `test:db:stop` — **local** vitest Postgres
- `test:e2e:install`, `test:e2e:agent` (**Cloud**), `test:e2e`, `test:e2e:db:start`, `test:e2e:db:stop` (**local** / CI)

## Running tests

```bash
npm run test
```

Uses `.env.test` and `vitest.config.mts`. Global setup serves Next on **3001**.

- **Cloud:** `agraria_test` on `5432`; no `test:db:start`
- **Local:** `npm run test:db:start` before, `test:db:stop` after

## Running Playwright e2e tests

Final check for UI, auth, parcels, treatments, dashboard charts.

**Shared:**

- App on **`http://127.0.0.1:3002`**; dev on 3000 can stay up
- E2e login: `playwright@agricolala.test` / `playwright-local-password` (not dev `.env` creds)
- `beforeAll` resets e2e DB, seeds data, logs in, writes `e2e/.auth/user.json`
- **Serial** suite; **English** UI (`/en`)
- Reset guard (no override): **Cloud** — DB name contains **`e2e`** (`agraria_e2e` on `5432`); **Local / CI** — `localhost`/`127.0.0.1` port **5434** or host **`postgres-e2e`**

**Cloud only:** `npm run test:e2e:agent` (`run-e2e-native.sh`; may need `sudo` on a fresh VM). Do not use Docker e2e in Cloud.

**Local / CI:** run `test:e2e:db:start` (starts Postgres + migrations) **before** `npm run test:e2e` in the same shell session.

On failure, inspect `test-results/` and `playwright-report/` (CI uploads these as artifacts).

**Selectors:** `getByRole` (name) → `getByLabel` → `getByPlaceholder` → visible text. Avoid `getByTestId` unless accessibility cannot be improved.

## Pre-commit hook

`npm run precommit` → ESLint + `npx biome check .`

## Authentication (credentials only)

Agents must sign in with the **credentials** form only. Do not use or configure any other sign-in provider.

When `TEST_USER_EMAIL` and `TEST_USER_PASSWORD` are set and `VERCEL_ENV` is not `production`:

**`.env` example:**

```
TEST_USER_EMAIL=test@agricolala.dev
TEST_USER_PASSWORD=test-password-dev
NEXTAUTH_SECRET=dev-secret-key-for-local-development-only
```

1. `npm run dev` → `http://localhost:3000/auth/signin`
2. “Sign in with credentials” with `.env` values
3. First login creates authorized `User`; accept ToS if prompted (e2e seed sets `tosAcceptedAt` to skip ToS in Playwright)
