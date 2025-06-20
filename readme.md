

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

the repository is connected to a vercel deployment. I f you push on main this will trigger a new deploy.

## Linting - formatting

```bash
npm run lint:fix
npm run prettify
npm run tsc
```