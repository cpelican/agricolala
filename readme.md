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

docker compose up

npx prisma migrate dev

npm run seed

npm run dev
npm run studio
```

## Run tests
In you env, you should have the following variables
```
# tests
POSTGRES_PASSWORD=agraria
DATABASE_URL=postgresql://agraria:agraria@localhost:5433/agraria?schema=public
DIRECT_URL=postgresql://agraria:agraria@localhost:5433/agraria?schema=public
```

Then run
`npm run test:db:start`
`npx vitest run`
`npm run test:db:stop`

## Run Playwright e2e tests

The Playwright tests run the app against a dedicated e2e PostgreSQL database in a **mobile viewport only** (Pixel 5). The suite seeds its own authorized test user, one parcel, and dashboard treatments in `beforeAll`. User-flow demo videos: `npm run test:e2e:demo` → `test-results/demo-videos/<slug>.webm` (see `e2e/demos/README.md`).

```bash
npm run test:e2e:install
npm run test:e2e:db:start
npm run test:e2e
npm run test:e2e:db:stop
```

`npm run test:e2e:db:start` starts `docker-compose.e2e.yml`, waits for PostgreSQL, applies Prisma migrations, and generates the Prisma client. The Playwright config provides local non-production defaults for `DATABASE_URL`, `DIRECT_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `TEST_USER_EMAIL`, and `TEST_USER_PASSWORD`. The e2e reset guard has no override and only allows localhost/127.0.0.1 on port 5434, local database names containing `e2e`, or the `postgres-e2e` Docker host.



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

## TODOs / docs
- [nope] use prisma studio
- [x] we would like to advise the use on the doses: see this document https://www.infowine.com/bassi-dosaggi-di-rame-in-viticoltura-per-il-controllo-della-peronospora-efficacia-e-stabilita-2/
- [x] create a stats db record that will be recalculated each time a user adds a treatment
- [x] Improve the queries, make them smaller, avoid nesting
- [x] excel export
- [x] improve security
- [x] fix map

- [x] https://dribbble.com/shots/25487881-Cruscott-Finance-Dashboard-Mobile



Things made to improve performance:
- [x] add subquery for the user when creating rls policies to avoid querying on each row the user
- [x] avoid doppione for the rls policy creation since for all was iterating on all queries, and then we were defining again the policy for select. This was an issue for the tables Product, Substance, Disease, SubstanceDose
- [x] page load - improve fcp: cache the session, and make the session handling less complicated. use it server side
