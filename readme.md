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
