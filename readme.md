# Agricolala

See you at https://agricolala-eta.vercel.app/

Agricolala helps you manage your wineyard treatments and track substance usage to ensure compliance with organic EU agricultural regulations.

![Welcome page of agricolala](https://github.com/cpelican/agricolala/blob/main/public/welcome_page.png)


## Run Agricolala locally

1. Create a Google Auth platform client
    - Add http://localhost:3000 as JavaScript origins
    - Add http://localhost:3000/api/auth/callback/google as redirect URL

2. Create a .env file with all the necessary variables

```bash
asdf install

npm i
# optional:
docker compose down --remove-orphans

docker compose up --force-recreate --remove-orphans

# first time you run the app: this will run ALL the migrations
npx prisma migrate deploy

npx prisma migrate dev

npm run seed

npm run dev
npm run studio # from there you can set isAuthorized to true for your local user
```

## Run tests (Vitest)

Integration tests use a **separate** Postgres on port **5433** (`docker-compose.test.yml`). Dev uses port **5435** — do not put test `DATABASE_URL` in `.env` or the Next.js test server will connect to the wrong database.

1. Copy the test env template (once):

```bash
cp .env.test.example .env.test
```

2. Start the test database, run tests, then stop:

```bash
npm run test:db:start   # Docker Postgres @ 5433 + migrate
npm run test            # or: npx vitest run
npm run test:db:stop
```

If `.env.test` is missing, tests fall back to the same defaults as `.env.test.example`. You still need Docker running for `test:db:start`.

One file: `npm run test -- lib/substance-helpers.test.ts`

## Run Playwright e2e tests

Mobile viewport only (Pixel 5), app on **127.0.0.1:3002**, e2e Postgres on **5434**. Conventions and UX workflow: [e2e/TESTING.md](e2e/TESTING.md).

```bash
npm run test:e2e:install   # once
npm run test:e2e           # global-setup starts Docker e2e DB + migrates if needed
```

Optional: `npm run test:e2e:db:start` / `test:e2e:db:stop` to manage the Docker DB yourself. One spec: `npx playwright test e2e/<spec>.spec.ts --project=mobile-chromium`. Demo video: `npm run test:e2e:record`.

Playwright ignores dev `.env` `DATABASE_URL` and uses the e2e database (`127.0.0.1:5434`). Auth defaults: `playwright@agricolala.test` / `playwright-local-password`.



## Deploy Agricolala

The repository is connected to a Vercel deployment. If you push to main, this will trigger a new deploy. Vercel only needs one env var for the database: `DATABASE_URL` (Transaction pooler, see below) — its build (`prisma generate && next build`) doesn't touch the database, and the running app only ever queries through `DATABASE_URL`. `DIRECT_URL` is not needed in Vercel; it's only used locally, for running migrations (see next section).

### Running migrations against production

Migrations aren't automatic — run them manually from your machine before merging to main. **Run the migration before merging.** Merging triggers an immediate Vercel deploy, so if the new code ships before the schema is updated, requests can hit missing columns/tables until you run the migration. Confirm `npm run migrate:deploy:prod` succeeds first, then merge.

To avoid keeping production credentials in `.env`, they're stored in the macOS Keychain and pulled in only for the duration of the command:

```bash
npm run migrate:deploy:prod
```

See [scripts/migrate-prod.sh](scripts/migrate-prod.sh). It refuses to run if the resolved `DIRECT_URL` host looks like `localhost`, to guard against silently migrating the wrong database.

**One-time setup / rotating credentials:**

`prisma/schema.prisma` defines both `DATABASE_URL` and `DIRECT_URL` — `prisma migrate deploy` connects via `DIRECT_URL`, so both need to be stored in Keychain, from Supabase's dashboard (Project Settings → Database → Connection string):

- `DATABASE_URL` → **Transaction pooler** (port 6543), with `?pgbouncer=true` appended — what Prisma Client uses at runtime; transaction-mode pooling fits Vercel's short-lived serverless functions. The `pgbouncer=true` flag disables Prisma's prepared-statement caching, which is required for transaction-mode pooling — without it, requests randomly fail with `prepared statement "sN" already exists` or `bind message supplies N parameters, but prepared statement "sN" requires M` once the pool starts reusing connections across queries.
- `DIRECT_URL` → **Session pooler** (port 5432), no extra params needed — migrations need DDL support, which transaction-mode pooling doesn't allow. Session-mode pooling keeps one Postgres backend per client connection, so prepared statements work fine here.

Don't use the raw **Direct connection** (`db.<ref>.supabase.co:5432`) for either — it's **IPv6-only**, and most home/office networks can't reach it, so `migrate deploy` fails with `P1001`.

```bash
security add-generic-password -a "$USER" -s agricolala-prod-db-url -w 'postgresql://...transaction-pooler...:6543/postgres?pgbouncer=true'
security add-generic-password -a "$USER" -s agricolala-prod-direct-url -w 'postgresql://...session-pooler...:5432/postgres'

# to update an existing entry (e.g. after rotating the DB password), add -U
security add-generic-password -U -a "$USER" -s agricolala-prod-direct-url -w 'postgresql://...'
```

The database password is shared across every connection method (pooled and direct). If you reset it in Supabase (Project Settings → Database → Reset database password), update it everywhere right away:

1. Both Keychain entries above (`-U` to overwrite).
2. `.env` locally, if you keep prod values there.
3. Vercel → Settings → Environment Variables → `DATABASE_URL` → then **redeploy** — Vercel bakes env vars into the deployment and won't pick up the change until you trigger a new one (Deployments → latest → ⋯ → Redeploy).

Do the Vercel update+redeploy promptly after resetting — the live site will fail to connect to the database from the moment the password is reset until Vercel picks up the new one.

If you need to update RLS policies for some new tables, make sure you update `supabase-setup.sql`.

## Linting & Formatting

```bash
npm run lint:fix
npm run prettify
npm run tsc
```

### MISC

Url for logout: http://localhost:3000/api/auth/signout