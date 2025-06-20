

# Agricolala
Agricolala helps you manage your vineyard treatments and track substance usage to ensure compliance with organic EU agricultural regulations.

## Run locally agricolala

1. Create a googlauth platform client
    - Add http://localhost:3000 as javascript origins
    - Add http://localhost:3000/api/auth/callback/google as redirect url

2. create an .env file with all the necessary variables


```bash
asdf install

npm i

docker compose up

npx prisma migrate dev

npm run dev
```

## Deploy agricolala

```bash
# pushes migrations to supabase
npx prisma migrate deploy
```

the repository is connected to a vercel deployment. If you push on main this will trigger a new deploy.

## Linting - formatting

```bash
npm run lint:fix
npm run prettify
npm run tsc
```


## TODOs
- [ ] we are sick and tired of supabase: maybe we want to host our own database? This way we wouldn't need to keep it active
- [ ] improve the queries, make them smaller, avoid nesting
- [ ] we want to check if the user has neighbours that have made some treatments: it could indicate they should do too
- [ ] when the user does a treatment, we want to find out what was the weather before and after -> maybe one day we can train a model dependening on this
- [ ] still thinking about a model, we could ask them how was their year just after the harvest.
- [ ] we let the user know if they are using less product compared to last year, give them a bit more data about how good they are at not using too much products