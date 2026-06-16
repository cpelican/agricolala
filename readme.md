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

npx prisma migrate dev

npm run seed

npm run dev
npm run studio
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

```bash
# Pushes migrations to Supabase
npx prisma migrate deploy
```

The repository is connected to a Vercel deployment. If you push to main, this will trigger a new deploy.

if you need to update some rls policies for some new tables, make sure you update supabase-setup.sql

## Linting & Formatting

```bash
npm run lint:fix
npm run prettify
npm run tsc
```

### MISC

Url for logout: http://localhost:3000/api/auth/signout