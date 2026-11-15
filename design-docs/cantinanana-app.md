# Design doc — Cantinanana: the winemaking app inside agricolala

## Relevant files

Files the second app touches or reuses.

| Area | File | Why it matters |
| --- | --- | --- |
| Routes | [app/[lang]/(app)](../app/%5Blang%5D/%28app%29), [app/[lang]/(site)](../app/%5Blang%5D/%28site%29), [app/[lang]/layout.tsx](../app/%5Blang%5D/layout.tsx) | Today's route groups; cantinanana gets its own group next to them |
| App layout | [app/[lang]/(app)/layout.tsx](../app/%5Blang%5D/%28app%29/layout.tsx), [components/layout](../components/layout) | `requireAuth`, the waiting screen for unapproved users, `LayoutWithHeader` with the title and icon; reused with cantinanana's title, icon and navigation |
| Navigation | [lib/app-shell.ts](../lib/app-shell.ts), [components/layout/bottom-navigation.tsx](../components/layout/bottom-navigation.tsx), [components/layout/sidebar-navigation.tsx](../components/layout/sidebar-navigation.tsx) | `navigation` is agricolala's menu; cantinanana needs its own, and an app switcher between the two |
| Proxy | [proxy.ts](../proxy.ts) | Locale prefix and `withAuth`; cantinanana's pages are protected routes like agricolala's, so nothing changes |
| Auth | [lib/auth.ts](../lib/auth.ts), [lib/auth-utils.ts](../lib/auth-utils.ts), [app/auth](../app/auth), [app/api/auth](../app/api/auth) | One sign-in, one session, used as is |
| Users and access | `User`, `AccessRequest`, `AdminUser` in the schema; [lib/access-requests.ts](../lib/access-requests.ts), [lib/actions-tos.ts](../lib/actions-tos.ts) | One approval (`isAuthorized`) and one terms acceptance for both apps, used as is |
| Database | [prisma/schema.prisma](../prisma/schema.prisma), [prisma/migrations](../prisma/migrations) | Cellar tables added to the same schema |
| Data access | [lib/data-fetcher.ts](../lib/data-fetcher.ts) and `lib/data-fetcher-*.ts`, [lib/actions.ts](../lib/actions.ts) and `lib/actions-*.ts` | DB access sealed in these modules (#97); cantinanana reads vineyard data through them |
| i18n | [lib/i18n](../lib/i18n), [locales](../locales) | Same locales; cantinanana's strings under their own key |
| Lint | [eslint.config.mjs](../eslint.config.mjs) | Gets the import boundary between the two apps |
| Package | [package.json](../package.json) | 7 dependencies are on `latest` |
| Related docs | [design-docs/fermentation.md](fermentation.md), [design-docs/shared-parcels.md](shared-parcels.md) | Cantinanana's first features; the parcel access rule both apps follow |

## Glossary

| Term | Meaning |
| --- | --- |
| App | What the user sees as a product: its own name, icon, menu and home page. agricolala (vineyard) and cantinanana (cellar). |
| Deployment | What Vercel builds and serves. Here: one deployment for both apps. |
| Route group | A folder in parentheses under `app/` (e.g. `(app)`) that groups pages under their own layout without adding to the URL. |
| App switcher | The menu entry that moves between agricolala and cantinanana. |
| Import boundary | A lint rule that stops one app's code from importing the other app's code. |

## Context

Keep agricolala focused on growing grapes, and build winemaking (the fermentation feature, [design-docs/fermentation.md](fermentation.md)) as a **separate app**, while both apps **share the same users and the same data** (product owner, 30 Oct 2026).

What this asks for:

- Two apps with their own scope, navigation and name.
- One account: a grower logged into one app is logged into the other.
- One database: cantinanana reads the vineyard data (parcels, treatments, weather, diseases) without copying it.

What it does not ask for: separate release schedules, a separate team, or separate users or data. So "separate app" is a product separation, not a deployment separation.

## Status

As of 31 Oct 2026. Design only; nothing started.

| Phase | PR | State |
| --- | --- | --- |
| PR 1 — pin the 7 dependencies on `latest` | — | Not started |
| PR 2 — cantinanana shell: route group, layout, menu, app switcher, import boundary | — | Not started |
| PR 3+ — fermentation v1 inside cantinanana ([fermentation.md](fermentation.md)) | — | Not started |

## Current state

One Next.js 16 app, one Vercel project (`www.agricolala.eu`), on PostgreSQL (Supabase) through Prisma 6.9. Pages live under `app/[lang]/`, in two route groups: `(site)` for the public pages (welcome, legal) and `(app)` for the logged-in app (home, parcels, treatments, profile, admin). `(app)/layout.tsx` checks the session, shows the waiting screen to unapproved users, and draws the header and menu.

| Area | Today | Gap for a second app |
| --- | --- | --- |
| Routes | `(site)` and `(app)` | No place for cellar pages with their own layout |
| Navigation | One `navigation` list in `lib/app-shell.ts` | No second menu, no way to switch apps |
| Data | Vineyard tables only | No lot, reading or addition tables |
| Code boundaries | Everything can import everything | Nothing keeps vineyard and cellar code apart |
| Dependencies | `prisma`, `@prisma/client`, `next-auth`, `@next-auth/prisma-adapter`, `chart.js`, `date-fns`, `react-chartjs-2` on `latest` | A fresh install can pull a new major version (Prisma 8 is in release candidate) |

## Proposed design

### Goals and non-goals

- **Goal:** cantinanana looks and feels like its own app: own name, icon, menu and home page.
- **Goal:** one account, one approval, one terms acceptance, nothing to set up for login.
- **Goal:** one database; cantinanana reads vineyard data without copying it.
- **Goal:** cellar code lives in its own folders, so it could be moved into a separate deployment later with file moves only.
- **Non-goal:** a separate deployment, Vercel project or domain now (see "Alternatives considered").
- **Non-goal:** a monorepo or shared packages.
- **Non-goal:** separate release schedules for the two apps.

### Layout in the repo

```
app/[lang]/
  (site)/                 ← public pages, unchanged
  (app)/                  ← agricolala, unchanged
  (cantinanana)/
    cantinanana/          ← URL /<lang>/cantinanana/…
      layout.tsx          ← session check, waiting screen, header and menu for cantinanana
      page.tsx            ← cantinanana's home
      fermentations/      ← first feature (fermentation.md)
      profile/            ← the same profile content, inside cantinanana's layout
components/cantinanana/   ← cellar components
lib/cantinanana/          ← cellar logic, data-fetcher and actions for cellar tables
locales/*.json            ← new `cantinanana.*` keys
```

- The route group `(cantinanana)` gives the cellar pages their own layout; the `cantinanana/` folder inside it gives them their own URL prefix, so the two apps' pages never collide (both have a home and a profile).
- URLs: `www.agricolala.eu/it/cantinanana`, `www.agricolala.eu/it/cantinanana/fermentations/…`.

### Layout and navigation

- `cantinanana/layout.tsx` does what `(app)/layout.tsx` does: `requireAuth()`, the waiting screen (`AccessPending`) for unapproved users, then `LayoutWithHeader` with cantinanana's title and icon. The shared part (session check, waiting screen) moves into one helper both layouts call, so the two cannot drift apart.
- `lib/app-shell.ts` gets a second menu, `cantinananaNavigation` (from fermentation.md: Vasche · Profilo · Agricolala). `BottomNavigation` and `SidebarNavigation` take the menu as a prop instead of importing `navigation` directly.
- **App switcher:** in each app, the last menu entry opens "Your apps" (Agricolala for the vineyard, Cantinanana for the cellar), as in fermentation.md's design. It is an ordinary link: same site, same session.
- Profile: the profile page's content is a component already; cantinanana renders it under `/cantinanana/profile` so the user stays inside cantinanana's layout.

### Login and access

Nothing changes:

- One sign-in page (`/auth/signin`), one NextAuth session cookie, one `NEXTAUTH_URL`. A link from agricolala to cantinanana stays logged in because it is the same site.
- `proxy.ts` already protects every page outside the public list, so `/…/cantinanana/…` is protected with no change.
- One approval (`isAuthorized`) and one terms acceptance for both apps. An unapproved user sees the same waiting screen in both.
- Sign-out works the same everywhere.
- Previews and local dev work as today.

### Data

- Cellar tables (`Fermentation`, `FermentationReading`, `FermentationAddition`, from fermentation.md) go into the same `prisma/schema.prisma`, created with `npx prisma migrate dev`. One migration history, as today.
- **Ownership:** cellar tables are written only by `lib/cantinanana/` (its own `data-fetcher-*.ts` and `actions-*.ts`, the #97 rule). Vineyard and user tables are written only by agricolala's code. Cantinanana reads vineyard data through the existing functions in `lib/data-fetcher*.ts` (e.g. `getParcels`, `getTreatmentsForYear`), read only.
- Supabase RLS: the PR that adds a cellar table adds its policy to `scripts/supabase-setup.sql`.

### Import boundary

A `no-restricted-imports` rule in `eslint.config.mjs`:

- Cellar code (`app/[lang]/(cantinanana)/**`, `components/cantinanana/**`, `lib/cantinanana/**`) may import shared code (`components/ui`, `components/layout`, `components/profile`, `components/auth`, `lib/i18n`, `lib/auth-utils`, the vineyard **read** functions in `lib/data-fetcher*.ts`) but not agricolala's feature components (`components/parcels`, `components/treatments`, …) or actions (`lib/actions*.ts`).
- Vineyard code may not import `components/cantinanana` or `lib/cantinanana`.

This keeps the later move into a separate deployment possible, and makes every dependency between the two apps visible.

### What stays as it is

- One Vercel project, one domain, the same crons, CI, tests and commands.
- The welcome page, sitemap and robots: cantinanana's pages are behind login, so they are not in the sitemap.

### Decisions

| # | Decision | Why |
| --- | --- | --- |
| D1 | One Next.js app and one deployment for both apps | The request is a product separation; one deployment gives one login and one database for free |
| D2 | Cantinanana under `/<lang>/cantinanana/…` on `www.agricolala.eu` | Same site: no cookie sharing, no redirect rules, previews and local dev keep working |
| D3 | Own route group, layout, menu and folders for cantinanana | Feels like its own app; code ready to move later |
| D4 | One schema; each table written by one app; cross-app reads through `lib/data-fetcher*.ts` | Same data without sync; the #97 rule |
| D5 | Lint import boundary between the apps | Keeps the code apart without a monorepo |
| D6 | One sign-in, one approval, one terms acceptance | Same users in both apps |
| D7 | Pin the 7 dependencies on `latest` | No surprise major upgrade |
| D8 | The winemaking app is named `cantinanana` | Product owner's choice |

## Rollout plan

| Phase | Scope | Risk | How to check |
| --- | --- | --- | --- |
| PR 1 | Pin the 7 dependencies on `latest` (`prisma`, `@prisma/client`, `next-auth`, `@next-auth/prisma-adapter`, `chart.js`, `date-fns`, `react-chartjs-2`) to the versions in the lockfile | Low | `npm ci`, `npm run tsc`, CI green |
| PR 2 | `(cantinanana)/cantinanana` route group with layout, empty home and profile; shared session-check helper for both layouts; `cantinananaNavigation`; menus take their list as a prop; app switcher in both apps; `cantinanana.*` translations; lint import boundary | Low: agricolala's pages only gain the switcher | E2e: logged in on agricolala → switcher → cantinanana home, still logged in; unapproved user sees the waiting screen on both; logged out → `/en/cantinanana` → sign-in → back |
| PR 3+ | Fermentation v1 inside cantinanana, per fermentation.md (its PR 1–3): cellar tables, `lib/cantinanana/`, pages under `cantinanana/fermentations` | As in fermentation.md | As in fermentation.md |

## Alternatives considered

### Monorepo with two deployments

The first version of this doc (commit `91d2088` on this branch) split the repo into npm workspaces (`apps/agricolala`, `apps/cantinanana`, `packages/db`, `packages/auth`) with one Vercel project per app, sharing the login through a cookie on `.agricolala.eu`.

Not chosen now, because it costs 5 setup PRs before the first cellar feature and brings problems the single app does not have: a renamed session cookie that logs everyone out once, a custom `redirect` callback, sign-out through agricolala, cantinanana previews that cannot log in, and local login sharing that may not work in browsers. Its main benefit, independent releases, is only partial with one shared schema.

When to revisit: if cantinanana needs its own release schedule, its own team, or its own users or database. Thanks to D3 and D5, the move is then mostly file moves.

### Same app on a subdomain (`cantinanana.agricolala.eu`)

`proxy.ts` could rewrite `cantinanana.agricolala.eu/<lang>/…` to `/<lang>/cantinanana/…`, so cantinanana gets its own address while staying one deployment.

Not chosen now: two hostnames bring back most of the login work of the monorepo option. The session cookie must move to `.agricolala.eu` (renamed, everyone logged out once), NextAuth v4 has a single `NEXTAUTH_URL`, so sign-in stays on `www` and needs a `redirect` callback for the way back, and previews only have one host. Can be added later on top of this design without moving any page.

## Open questions and risks

- [ ] Subdomain later? Only if the product owner wants a separate address; see "Alternatives considered".
- [ ] Welcome page: should it present both apps?
- [ ] fermentation.md calls the app "Cantina" and links to `monorepo.md`; update it to `cantinanana` and this file when #105 is next touched.

- **Risk — the two layouts drifting apart** (one checks access, the other forgets): mitigated by the shared session-check helper and an e2e test for the waiting screen in both apps.
- **Risk — the boundary eroding:** a cellar file importing vineyard components makes a later split harder. The lint rule fails CI.
- **Risk — one build for both:** a broken cellar page blocks agricolala's deploy too. Same CI as today catches it before merge.

## Sources

- Repo: `app/[lang]/(app)/layout.tsx`, `proxy.ts`, `lib/app-shell.ts`, `lib/auth.ts` (as of 31 Oct 2026).
- [Next.js — Route groups](https://nextjs.org/docs/app/api-reference/file-conventions/route-groups) (known, not opened for this doc).
- [ESLint — `no-restricted-imports`](https://eslint.org/docs/latest/rules/no-restricted-imports) (known, not opened for this doc).
