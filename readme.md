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
npx run prisma studio
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
- [nope] use prisma studio
- [x] we would like to advise the use on the doses: see this document https://www.infowine.com/bassi-dosaggi-di-rame-in-viticoltura-per-il-controllo-della-peronospora-efficacia-e-stabilita-2/
- [x] create a stats db record that will be recalculated each time a user adds a treatment
- [ ] Find alternatives to supabase
- [x] Improve the queries, make them smaller, avoid nesting
- [ ] We want to check if the user has neighbors that have made some treatments: it could indicate they should do too
- [ ] When the user does a treatment, we want to find out what the weather was before and after
- [x] excel export
- [x] improve security
- [ ] fix map
- [ ] make the 3x10 rule
- [ ] let the user know if they are using less product compared to last year, give them a bit more data about how good they are at not using too much product
- [ ] interesting: Look at https://api.open-meteo.com/v1/forecast?latitude=44.0998&longitude=9.7387&hourly=temperature_2m,precipitation_probability,precipitation,apparent_temperature,temperature_80m&past_days=7

- [x] https://dribbble.com/shots/25487881-Cruscott-Finance-Dashboard-Mobile

