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

### Starting the Dev Environment (full sequence)

```bash
# 1. Start PostgreSQL
sudo pg_ctlcluster 16 main start

# 2. Apply any new migrations
npx prisma migrate dev

# 3. Start the dev server
npm run dev
```

The dev server runs on `http://localhost:3000`. Login at `/auth/signin` with the credentials from `.env` (see Authentication section below).

### Common Commands

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

### Running Playwright e2e Tests

Use Playwright as the final agent check when UI flows, auth, parcel creation, treatment creation, or dashboard chart behavior changes.

```bash
npm run test:e2e:install
npm run test:e2e:agent
```

Agents should use native PostgreSQL via `npm run test:e2e:agent`; do not use Docker Compose in Cursor Cloud. The Playwright `beforeAll` resets the e2e database, seeds an authorized test user, one parcel, and four April treatments for the dashboard chart, then logs in through the credentials form. The reset guard has no override and only allows localhost/127.0.0.1 on port 5434, local database names containing `e2e`, or the `postgres-e2e` Docker host.

When writing Playwright tests, prefer accessible selectors in this order: `getByRole` with a name, `getByLabel`, `getByPlaceholder`, and visible text. Avoid `getByTestId` unless there is no practical accessible surface; if a test needs one, first consider improving the component semantics with labels, roles, or accessible names.

### Pre-commit Hook

The `.husky/pre-commit` hook runs `npm run precommit` which executes:
- `npm run lint` (ESLint)
- `npx biome check .` (Biome formatting/linting)

### Authentication (Dev/Test Credentials Login)

A `CredentialsProvider` is enabled when `TEST_USER_EMAIL` and `TEST_USER_PASSWORD` are set in `.env`. This allows agents and developers to log in without Google OAuth. The credentials provider works during both `npm run dev` and `npm run build` (since `next build` sets `NODE_ENV=production` internally).

**Required env vars for auth** (must be set in `.env`):
```
TEST_USER_EMAIL=test@agricolala.dev
TEST_USER_PASSWORD=test-password-dev
NEXTAUTH_SECRET=dev-secret-key-for-local-development-only
```

`GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` can be left empty when `TEST_USER_EMAIL`/`TEST_USER_PASSWORD` are set — the app will start and build without the Google provider.

**How login works:**

1. Start the dev server: `npm run dev`
2. Navigate to `http://localhost:3000/auth/signin`
3. The sign-in page shows an email/password form (credentials provider)
4. Enter `TEST_USER_EMAIL` and `TEST_USER_PASSWORD` values and submit
5. On first login, a `User` record is auto-created with `isAuthorized: true`
6. After login you're redirected to the main app at `/{locale}`

**First-time login note:** After the first credentials login, the app shows a Terms of Service dialog. Accept it to proceed to the full app UI.

**Google OAuth:** When `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` are also set, Google OAuth appears as an additional sign-in option alongside credentials.
