# Agricolala

See you at https://agricolala-eta.vercel.app/

Agricolala helps you manage your vineyard treatments and track substance usage to ensure compliance with organic EU agricultural regulations.

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

npm run dev
```

## Deploy Agricolala

```bash
# Pushes migrations to Supabase
npx prisma migrate deploy
```

The repository is connected to a Vercel deployment. If you push to main, this will trigger a new deploy.

## Linting & Formatting

```bash
npm run lint:fix
npm run prettify
npm run tsc
```

## TODOs
- [ ] create a stats db record that will be recalculated each time a user adds a treatment
- [ ] We are sick and tired of Supabase: maybe we want to host our own database? This way we wouldn't need to keep it active
- [ ] Improve the queries, make them smaller, avoid nesting
- [ ] We want to check if the user has neighbors that have made some treatments: it could indicate they should do too
- [ ] When the user does a treatment, we want to find out what the weather was before and after -> maybe one day we can train a model depending on this
- [ ] Still thinking about a model, we could ask them how their year was just after the harvest. This way we would have a clue about wether thir general behaviour was successful
- [ ] We let the user know if they are using less product compared to last year, give them a bit more data about how good they are at not using too much product

