# Design doc — Monorepo: agricolala and a winemaking app sharing users and data

## Relevant files

Files the migration moves, splits or rewires.

| Area | File | Why it matters |
| --- | --- | --- |
| Package and scripts | [package.json](../package.json), [package-lock.json](../package-lock.json) | Becomes the workspace root; every script (`dev`, `build`, `test`, `test:e2e`, `migrate:deploy:prod`, `seed`…) is moved or delegated. 7 dependencies are on `latest` |
| TypeScript | [tsconfig.json](../tsconfig.json) | `@/*` → `./*` alias used by 155 files (247 imports from `@/lib`, 151 from `@/components`) |
| Next.js | [next.config.mjs](../next.config.mjs) | `serverExternalPackages: ["@prisma/client"]`, `serverActions.allowedOrigins` (`www.agricolala.eu`, `agricolala.eu`, `agricolala-eta.vercel.app`), Turbopack SVG rule |
| Vercel | [vercel.json](../vercel.json) | Crons (`suggest-treatments`, `fetch-weather-history`) — must stay with agricolala only |
| Database | [prisma/schema.prisma](../prisma/schema.prisma), [prisma/migrations](../prisma/migrations), [prisma/seed.ts](../prisma/seed.ts) | Single schema and migration history, to move into a shared package |
| Prisma client | [lib/prisma.ts](../lib/prisma.ts), [lib/taint-utils.ts](../lib/taint-utils.ts) | The client singleton and credential tainting |
| Data access | [lib/data-fetcher.ts](../lib/data-fetcher.ts) and `lib/data-fetcher-*.ts`, [lib/actions.ts](../lib/actions.ts) and `lib/actions-*.ts`, [lib/cron-*.ts](../lib/cron-fetch-weather-history.ts) | DB access already sealed in these modules (#97); the reads cantinanana needs move from here into `packages/db` |
| Auth | [lib/auth.ts](../lib/auth.ts), [lib/auth-utils.ts](../lib/auth-utils.ts), [proxy.ts](../proxy.ts), [app/auth](../app/auth), [app/api/auth](../app/api/auth) | NextAuth 4.24 with `strategy: "jwt"`, Credentials + Google providers, sign-in page `/auth/signin`, `withAuth` in the proxy |
| Users and access | `User`, `AccessRequest`, `AdminUser` in the schema; [lib/access-requests.ts](../lib/access-requests.ts), [lib/actions-tos.ts](../lib/actions-tos.ts) | Approval (`isAuthorized`) and terms acceptance — one of each for both apps (D7) |
| i18n | [lib/i18n](../lib/i18n), [locales](../locales), [contexts/translations-context.tsx](../contexts/translations-context.tsx) | Both apps need the same locale handling |
| UI | [components/ui](../components/ui), [components.json](../components.json), [app/globals.css](../app/globals.css), [tailwind.config.js](../tailwind.config.js), [postcss.config.mjs](../postcss.config.mjs) | shadcn components and theme, shareable |
| Site URL | [lib/site-url.ts](../lib/site-url.ts) | Uses `NEXT_PUBLIC_SITE_URL`, else `VERCEL_PROJECT_PRODUCTION_URL`, which may not be the `www.` address; each project sets `NEXT_PUBLIC_SITE_URL` |
| Unit / integration tests | [vitest.config.mts](../vitest.config.mts), [test](../test) | `globalSetup` boots Next on port 3001 from the repo root (`next({ dev })`) |
| E2e | [playwright.config.ts](../playwright.config.ts), [e2e](../e2e), [docker-compose.e2e.yml](../docker-compose.e2e.yml) | `webServer` runs `npm run dev` on 127.0.0.1:3002 |
| Test DB scripts | [scripts](../scripts) (`run-test-integration.sh`, `setup-e2e-db.sh`, `setup-e2e-native.sh`, `migrate-prod.sh`, `supabase-setup.sql`…), [docker-compose.test.yml](../docker-compose.test.yml), [docker-compose.yml](../docker-compose.yml) | Hard-coded paths to `prisma/`, run from the repo root |
| CI | [.github/workflows/test.yml](../.github/workflows/test.yml) | `npm ci`, `prisma generate`, `prisma migrate deploy`, `vitest run`, `npm run test:e2e` from the root |
| Lint / format | [eslint.config.mjs](../eslint.config.mjs), [biome.json](../biome.json), [.husky/pre-commit](../.husky/pre-commit), `knip` script | Root-level configs; `precommit` runs `eslint . && biome check .` |
| Agent docs | [CLAUDE.md](../CLAUDE.md), [AGENTS.md](../AGENTS.md), [readme.md](../readme.md), [e2e/TESTING.md](../e2e/TESTING.md) | Every command and port documented there changes path |
| Related docs | [design-docs/fermentation.md](fermentation.md), [design-docs/shared-parcels.md](shared-parcels.md) | The winemaking app's first features; the parcel access rule both apps must follow |

## Glossary

| Term | Meaning |
| --- | --- |
| Monorepo | One Git repository holding several apps and shared packages. |
| Workspace | npm's way of declaring the apps and packages of a monorepo (`workspaces` in the root `package.json`); one install, one lockfile, local packages linked by name. |
| App | A deployable Next.js project (`apps/agricolala`, later `apps/cantinanana`). One Vercel project each. |
| Package | Shared code imported by the apps (`packages/db`, later `packages/auth`, `packages/ui`…). Not deployed on its own. |
| Root Directory | Vercel project setting telling it which folder of the repo to build. |
| SSO (single sign-on) | Logging in once and being logged in on both apps. |
| Session cookie | NextAuth's cookie holding the JWT (today `__Secure-next-auth.session-token` in production; renamed in PR 4). |
| Public suffix | A domain under which sites cannot share cookies with each other, e.g. `vercel.app`. |

## Context

Keep agricolala focused on growing grapes, and build winemaking (the fermentation feature, [design-docs/fermentation.md](fermentation.md)) as a **separate app**, while both apps **share the same users and the same data** (product owner, 30 Oct 2026).

What this asks for:

- Two apps with their own scope, navigation and release pace.
- One account: a grower logged into one app is logged into the other.
- One database: the winemaking app reads the vineyard data (parcels, treatments, weather, diseases) without copying it.

## Status

As of 30 Oct 2026. Design only; nothing started.

| Phase | PR | State |
| --- | --- | --- |
| PR 1 — pin the 7 dependencies on `latest` | — | Not started |
| PR 2 — npm workspaces; move the app to `apps/agricolala`; CI, scripts, Vercel Root Directory | — | Not started |
| PR 3 — `packages/db`: schema, migrations, seed, Prisma client | — | Not started |
| PR 4 — session cookie shared on `.agricolala.eu`, in `lib/auth.ts` | — | Not started |
| PR 5 — `packages/auth`, `packages/ui`, `packages/i18n` as the second app needs them; `apps/cantinanana` skeleton with SSO | — | Not started |

## Current state

One Next.js 16 app at the repo root, deployed as one Vercel project (`www.agricolala.eu`, also reachable at `agricolala-eta.vercel.app`), on PostgreSQL (Supabase) through Prisma 6.9.

| Area | Today | Gap for two apps |
| --- | --- | --- |
| Layout | Everything at the root: `app/`, `components/`, `lib/`, `prisma/`, `e2e/`, `test/`, `scripts/` | No place for a second app or shared code |
| Imports | `@/…` alias rooted at the repo | Must keep working after the move, without touching 155 files |
| Database | `prisma/schema.prisma` + migrations, client in `lib/prisma.ts`, `prisma generate` in `build` | Two apps must use the same schema and client, and only one place may run migrations |
| Dependencies | `prisma`, `@prisma/client`, `next-auth`, `@next-auth/prisma-adapter`, `chart.js`, `date-fns`, `react-chartjs-2` on `latest` | A workspace install can pull a new major mid-migration (Prisma 8 is in release candidate: `8.0.0-rc.29`) |
| Auth | NextAuth 4.24.15, JWT sessions, default cookies, Credentials + Google | Cookie bound to the current host; no sharing across apps |
| Domain | Custom domain `www.agricolala.eu` (since 28 Oct 2026), plus `agricolala-eta.vercel.app` | The second app needs a subdomain of `agricolala.eu`; `vercel.app` is a public suffix, so two `*.vercel.app` projects cannot share a cookie |
| Tests and CI | Vitest boots Next from the root on 3001; Playwright runs `npm run dev` on 3002; CI runs everything from the root | All paths and working directories change |
| Crons | `vercel.json` at the root | Must stay attached to agricolala only, or they run twice |

## Proposed design

### Goals and non-goals

- **Goal:** agricolala keeps working exactly as today at each step: same URLs, same tests, same deploys.
- **Goal:** one schema, one migration history, one Prisma client for both apps.
- **Goal:** one login for both apps.
- **Goal:** each app deploys on its own; a change to one does not rebuild the other unless shared code changed.
- **Goal:** move files with `git mv` so `git log --follow` keeps their history.
- **Non-goal:** rewriting imports, renaming modules or refactoring while moving. Moves only.
- **Non-goal:** extracting every shared module up front. A package is created when the second app needs it.
- **Non-goal:** separate databases or an API between the apps.
- **Non-goal:** changing package manager (npm stays) or upgrading Prisma/NextAuth majors as part of this.

### Target layout

```
/                         ← workspace root: package.json (workspaces), lockfile, lint/format configs, husky, CI
apps/
  agricolala/             ← today's app, moved as is: app/, components/, lib/, hooks/, contexts/, locales/,
                            public/, e2e/, test/, proxy.ts, next.config.mjs, vercel.json (crons), tsconfig.json
  cantinanana/            ← later: the winemaking app
packages/
  db/                     ← schema.prisma, migrations/, seed.ts, the Prisma client singleton
  auth/                   ← later: NextAuth options, session types, cookie settings
  ui/                     ← later: shadcn components, globals.css, Tailwind preset
  i18n/                   ← later: locale handling (lib/i18n), shared strings
scripts/                  ← repo-wide scripts (test DBs, migrate-prod)
docker-compose*.yml       ← test and e2e databases, shared
```

- Package names under one scope, e.g. `@agricolala/db`, `@agricolala/auth`. Vercel needs unique names and explicit dependencies to skip unaffected apps (Vercel monorepo docs).
- Inside `apps/agricolala`, `tsconfig.json` keeps `@/*` → `./*`, so no import changes.
- Packages ship TypeScript source; the apps compile them (`transpilePackages: ["@agricolala/db", …]` in each `next.config.mjs`).

### Database package (`packages/db`)

- Holds `schema.prisma`, `migrations/`, `seed.ts` and the client singleton (today's `lib/prisma.ts` and `taint-utils.ts`), exported as `@agricolala/db`.
- `prisma generate` runs in the package (`postinstall` or a `generate` script the apps' `build` calls first), so both apps get the same generated client.
- **Only one place migrates:** `migrate-prod.sh` and CI run `prisma migrate deploy` from `packages/db`. Neither app's build runs migrations.
- **Each table has an owner app:** vineyard tables (parcels, treatments, phenology, weather, aggregations, diseases, products) and user tables (`User`, `AccessRequest`, `AdminUser`, terms acceptance) are written by agricolala; cellar tables (lots, readings, additions) by cantinanana. The other app may only read them.
- **Cross-app reads live in `packages/db`:** an app cannot import another app's `lib/`, so the read functions one app offers the other (e.g. parcels, treatments and weather for cantinanana) move into `packages/db`, next to the client. Writes and app-only reads stay in each app's `lib/data-fetcher*.ts` and `lib/actions*.ts` (the #97 rule, per app).
- All tables stay together in the same Postgres schema; no per-app schemas.
- Stay on Prisma 6 (pinned). The official Turborepo guide now targets Prisma 8, which has no `prisma generate` (contract emit instead) and a different migration workflow; that upgrade is its own project.

### Shared login

- NextAuth uses JWT sessions, so no auth server is needed: both apps verify the same cookie if they share **the same `NEXTAUTH_SECRET`** and **the cookie is set on the parent domain**.
- Parent domain: `agricolala.eu`, already agricolala's custom domain. agricolala stays on `www.agricolala.eu`; cantinanana gets `cantinanana.agricolala.eu`. Two `*.vercel.app` URLs could not share a cookie.
- Override `cookies.sessionToken` in the shared auth options (`lib/auth.ts` in PR 4, moved to `packages/auth` in PR 5):
  - **Domain from an env var** (`AUTH_COOKIE_DOMAIN`): `.agricolala.eu` in production, unset on previews (cookie stays per host), and a shared local parent domain in dev (e.g. `.agricolala.localhost`, with the apps on `agricolala.localhost` and `cantinanana.agricolala.localhost`; to verify in browsers in PR 5).
  - **New cookie name** (e.g. `agricolala.session-token`, with the `__Secure-` prefix only on HTTPS). Keeping today's name would leave two cookies with the same name (the old one on `www.agricolala.eu`, the new one on `.agricolala.eu`); the browser sends both and NextAuth may read the old one. A new name makes the switch clean: the old cookie is ignored and expires.
  - NextAuth notes that custom cookies opt out of its defaults, so all options of that cookie must be given, and the same cookie name must be passed to `withAuth` and `getToken`. The CSRF and callback cookies stay per host.
- **One sign-in page, hosted by agricolala only** (`www.agricolala.eu/auth/signin`). cantinanana has no sign-in page and no NextAuth route: when it finds no session, it redirects there with `callbackUrl` set to its own URL. One set of Google redirect URIs.
- **New `redirect` callback:** after sign-in the user goes back to the app they came from. NextAuth's default `redirect` only allows the same origin, so a `callbackUrl` on `cantinanana.agricolala.eu` would land on agricolala. The callback allows `https://*.agricolala.eu` origins too, and falls back to agricolala for anything else.
- **agricolala keeps writing the users:** sign-in (including the Google `signIn` callback that creates `User`), access requests, the waiting screen for unapproved users, terms acceptance and `/admin/access-requests` stay in agricolala.
- **How cantinanana reads the session:** on the server only (`getServerSession`, `withAuth` in its proxy), with the same shared auth options. So its `jwt` callback runs too: it re-reads `isAuthorized` and `locale` from `User` and rewrites the cookie, as agricolala does today. This is a read of `User`, not a write, and it means a new approval shows up in cantinanana at the next request. Client-side `useSession` is not available in cantinanana (it needs the `/api/auth` routes); pages pass the user down from the server.
- **Sign-out:** `signOut()` posts to `/api/auth/signout` on the current host, which cantinanana does not have. cantinanana's sign-out button links to agricolala's sign-out instead (a page on `www.agricolala.eu` that calls `signOut()`); the cookie is shared, so the user is signed out of both apps.
- One approval (`isAuthorized`) and one terms-of-service acceptance cover both apps; no per-app access flag. An unapproved or not-yet-accepted user on cantinanana is redirected to agricolala, which shows the waiting or terms screen.
- `serverActions.allowedOrigins` and `NEXT_PUBLIC_SITE_URL` are set per app (`https://www.agricolala.eu` and `https://cantinanana.agricolala.eu`). `NEXTAUTH_URL` only in agricolala, the only app with NextAuth routes. Without `NEXT_PUBLIC_SITE_URL`, `lib/site-url.ts` falls back to `VERCEL_PROJECT_PRODUCTION_URL`, which may be `agricolala.eu` instead of `www.agricolala.eu`.
- Preview deployments stay on `*.vercel.app`, so SSO only works in production and locally (with `AUTH_COOKIE_DOMAIN` set, see above). Since cantinanana has no sign-in of its own, its previews cannot log in; to test it, run it locally next to agricolala.

### Vercel projects

- agricolala's existing project: Root Directory set to `apps/agricolala` (same project, same env vars, same domain, same crons). The switch is made in the same window as merging PR 2.
- The second app: a new project from the same repo, Root Directory `apps/cantinanana`, its own env vars (same `DATABASE_URL`, `DIRECT_URL`, `NEXTAUTH_SECRET`), no crons.
- "Skip unaffected projects" is on by default for monorepos with npm workspaces: a commit touching only one app does not rebuild the other (Vercel monorepo docs).
- Optional: `npm install --workspace=<app>` as install command to install only what the app needs (Vercel monorepo docs).

### Tests, CI and local dev

- Vitest and Playwright configs move with the app; their ports (3001, 3002) and database setup do not change.
- Test DB scripts and docker-compose files stay at the root and point at `packages/db` for migrations.
- CI: same two jobs; `npm ci` at the root, `prisma generate` and `migrate deploy` in `packages/db`, then `vitest`/`playwright` in `apps/agricolala` (`working-directory` or `npm run -w`). A job per app once the second app exists.
- Root scripts delegate, so commands stay the same for humans and agents: `npm run dev` → agricolala, `npm run test`, `npm run test:e2e`, `npm run seed`, `npm run migrate`.
- Lint and format configs stay at the root and cover all workspaces; husky stays at the root.
- `knip` gets a workspace config.
- CLAUDE.md, AGENTS.md, readme and e2e/TESTING.md updated in the same PR as the move.

### Decisions

| # | Decision | Why |
| --- | --- | --- |
| D1 | npm workspaces, no Turborepo to start | The repo already uses npm; Vercel skips unaffected apps with npm workspaces. Turborepo (task caching) can be added later without moving files |
| D2 | Move the app first, extract packages later | A move-only PR is easy to review and to revert; extracting while moving mixes two risks |
| D3 | `packages/db` is the only shared package before the second app starts; it also holds the cross-app read functions | The schema is the one thing that must never be duplicated; an app cannot import another app's `lib/` |
| D4 | One database, table ownership per app, reads across apps through functions in `packages/db` | Same data without sync; keeps the "DB access in a few modules" rule of #97 |
| D5 | SSO through a shared JWT cookie on the parent domain | No auth server; works because sessions are already JWT |
| D6 | Pin all 7 dependencies on `latest` before moving | Avoids a major upgrade sneaking in through the new workspace install |
| D7 | One sign-in page hosted by agricolala, one approval and one terms acceptance for both apps; agricolala writes the user tables | Same users in both apps; a `redirect` callback sends the user back to where they arrived from |
| D8 | All tables in the same Postgres schema | Keeps one place for the data and one RLS script |
| D9 | The winemaking app is named `cantinanana` | Product owner's choice |

## Rollout plan

| Phase | Scope | Risk | How to check |
| --- | --- | --- | --- |
| PR 1 | Pin the 7 dependencies on `latest` (`prisma`, `@prisma/client`, `next-auth`, `@next-auth/prisma-adapter`, `chart.js`, `date-fns`, `react-chartjs-2`) to the versions in the lockfile | Low | `npm ci`, `npm run tsc`, CI green |
| PR 2 | Root `package.json` with `workspaces`; `git mv` the app into `apps/agricolala` (incl. `prisma/` for now, `e2e/`, `test/`); root scripts delegate; CI working directories; scripts' paths; docs. Vercel Root Directory switched at merge | Medium: deploy config | CI green; preview deploy works; after merge, production deploy, login, a cron run by hand (`/api/cron/...` with the secret) |
| PR 3 | `packages/db`: move `prisma/` and the client; apps import `@agricolala/db`; `migrate-prod.sh`, test DB scripts and CI migrate from the package | Medium: generated client path | `prisma generate` in CI; Vitest integration tests; e2e; `npm run migrate:deploy:prod` dry run against a local DB (the script refuses localhost, so test the path change with a copy) |
| PR 4 | In `lib/auth.ts` and `proxy.ts` (still in agricolala): session cookie with its new name and `AUTH_COOKIE_DOMAIN` (`.agricolala.eu` in production); `redirect` callback allowing `*.agricolala.eu` | Medium: everyone is logged out once (new cookie name) | Log in, check the cookie's name and domain; logout/login; `withAuth` still protects pages |
| PR 5 | Move the auth options from `lib/auth.ts` into `packages/auth` (then `ui`, `i18n` as needed); agricolala sign-out page for cantinanana; `apps/cantinanana` skeleton: one protected page showing the logged-in user and a count from a `packages/db` read function; its Vercel project and `cantinanana.agricolala.eu` | Low for agricolala | Logged into agricolala → open cantinanana → already logged in; logged out → open cantinanana → sign in on agricolala → back on cantinanana; sign out from cantinanana → signed out of both |

Then the winemaking app's v1 ([design-docs/fermentation.md](fermentation.md), its PR 1–3) is built in `apps/cantinanana`.

## Open questions and risks

- [x] Second app's name: `cantinanana` (D9).
- [x] Parent domain: `agricolala.eu`, already in use.
- [x] Access per app: one approval (`isAuthorized`) and one terms acceptance for both apps (D7).
- [x] Sign-in page: hosted by agricolala only; a `redirect` callback sends the user back to the app they arrived from (D7).
- [x] Who writes the user tables: agricolala, for now (D7).
- [x] Supabase RLS (`scripts/supabase-setup.sql`): tables stay together in the same schema, so one script covers them (D8).
- [x] Supabase RLS for new tables: the PR that adds a table adds its policy to `scripts/supabase-setup.sql`, so cellar tables get theirs from cantinanana's PRs (D4).
- [ ] Local SSO: check that browsers accept a cookie on `.agricolala.localhost` (PR 5); if not, use another local parent domain.
- [ ] Turborepo: worth it once CI runs two apps (cached `tsc`, lint, tests per workspace)? Deferred; decide later.

- **Risk — the Vercel Root Directory switch:** a wrong setting breaks production deploys. Mitigation: switch at merge time, keep the previous deployment ready to promote back.
- **Risk — crons running twice:** only `apps/agricolala/vercel.json` declares crons; the second project has none.
- **Risk — one schema, two release paces:** a migration for one app ships to the shared DB before the other app is deployed. Rule: migrations are additive (new tables/columns, nullable or with defaults); destructive changes in two steps.
- **Risk — logout on cookie change (PR 4):** the new cookie name logs everyone out once; announce it, or ship it with a release growers expect.
- **Risk — Prisma client in workspaces:** `@prisma/client` generated into the hoisted `node_modules`; if an app resolves another copy, queries fail at runtime. Check with a production build of each app, not only `dev`.

## Sources

Pages opened for this doc (as of 30 Oct 2026):

1. [Vercel — Using Monorepos](https://vercel.com/docs/monorepos) (one project per Root Directory, skipping unaffected projects with npm/pnpm/yarn/Bun workspaces, filtered installs)
2. [NextAuth.js v4 — Options: cookies and secret](https://next-auth.js.org/configuration/options#cookies) (sharing session tokens across subdomains, custom cookie caveats)
3. [Prisma — Turborepo guide](https://www.prisma.io/docs/guides/turborepo) (shared database package; now written for Prisma 8)
4. [Public Suffix List](https://publicsuffix.org/list/public_suffix_list.dat) — `vercel.app` is listed, which is why two `*.vercel.app` apps cannot share a cookie
5. Repo: installed versions from `node_modules` (Prisma 6.9.0, NextAuth 4.24.15) and `npm view prisma version` (8.0.0-rc.29)

Known but not opened for this doc:

- [Next.js — `transpilePackages`](https://nextjs.org/docs/app/api-reference/config/next-config-js/transpilePackages)
- [npm — workspaces](https://docs.npmjs.com/cli/using-npm/workspaces)
