# AGENTS.md

## Cursor Cloud specific instructions

### Overview

Agricolala is a Next.js 15 + React 19 web app for managing vineyard treatments and tracking substance usage for organic EU compliance. Uses Prisma ORM with PostgreSQL, Google OAuth via NextAuth, and is deployed on Vercel.

### Database

PostgreSQL 16 is installed natively (not Docker, to avoid Docker Hub rate limits). The `agraria` user has superuser privileges (needed for integration tests that set `session_replication_role`).

- Dev database: `agraria` on `localhost:5432`
- Test database: `agraria_test` on `localhost:5432`

To start PostgreSQL if it's not running:
```
sudo pg_ctlcluster 16 main start
```

### Environment Variables

The `.env` file uses `localhost:5432` (native PostgreSQL) instead of the Docker port `5435` documented in the README. The `.env.test` file also uses port `5432`.

### Running the Application

Standard commands from `package.json`:
- `npm run dev` — starts Next.js dev server on port 3000
- `npm run lint` — ESLint
- `npm run tsc` — TypeScript type checking
- `npm run build` — production build (includes `prisma generate`)
- `npm run seed` — seeds reference data (products, substances, diseases)
- `npm run studio` — Prisma Studio GUI

### Running Tests

```bash
npx vitest run
```

Tests use `.env.test` (loaded by vitest config). The global setup starts a Next.js server on port 3001 and connects to `agraria_test` database. No need to run `test:db:start` since PostgreSQL runs natively.

One integration test (`should create a TODO treatment when all products used in last treatment are no longer considered active`) has a pre-existing date-sensitivity issue that may fail depending on the current month.

### Pre-commit Hook

The `.husky/pre-commit` hook runs `npm run precommit` which executes:
- `npm run lint` (ESLint)
- `npx biome check .` (Biome formatting/linting)

### Authentication

Google OAuth is required for user login. Without valid `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`, users cannot authenticate through the UI. The app still starts and serves pages; the sign-in button simply won't work. For testing authenticated flows, create users directly in the database.
