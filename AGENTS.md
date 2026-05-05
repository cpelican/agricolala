# Agricolala — notes for contributors and coding assistants

**Agricolala** is a web app for managing **vineyard/agricultural parcels**, **treatments** (diseases, products, water dose), and **tracking agrochemical use** (active substances, limits per hectare, compliance-style summaries). The UI supports localized strings (e.g. Italian/English).

**Stack (high level):** Next.js (App Router), React, TypeScript, Prisma + PostgreSQL, NextAuth, Tailwind/shadcn-style UI, Vitest for unit tests.

---

## Main commands

| Command | Purpose |
|--------|--------|
| `npm run dev` | Start Next.js in development |
| `npm run build` | `prisma generate` + production build |
| `npm start` | Run production server (after `build`) |
| `npm run lint` | ESLint |
| `npm run tsc` | Typecheck (`tsc --noEmit`) |
| `npx vitest` / `npx vitest run` | Run tests (see `vitest` config in repo) |
| `npm run migrate` | Prisma migrate dev + generate (see [Database migrations](#database-migrations-prisma)) |
| `npm run seed` | Run `prisma/seed.ts` |
| `npm run studio` | Prisma Studio (DB browser) |
| `npm run populate-aggregations` | Refresh substance aggregation data (script) |
| `npm run test:db:start` / `test:db:stop` | Integration test DB (Docker) |
| `npm run create-admin-user` | Admin user helper script |
| `npm run precommit` | Lint + Biome (used with Husky) |

**Environment:** set `DATABASE_URL` (and any NextAuth/secret vars your deployment expects) — see `.env` / deployment docs you maintain locally.

---


## Main Rules for development

### TypeScript: type guards, not coercive assertions

- Do **not** use `as SomeType` (or `as unknown as ...`) to force a value into a type. That hides mistakes and fights the checker.
- **Prefer** narrowing the type checker can follow: [type predicates](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#using-type-predicates) (`function isFoo(x): x is Foo`), checks with `in` / `instanceof`, discriminated unions, and runtime validation (e.g. Zod) with inferred types.
- **OK:** `as const` for literal/tuples, and `satisfies` to check excess properties without erasing a inferred type.

### TypeScript: Prisma types first — avoid duplicate shapes

- For anything that reflects **database fields or query results**, **do not** invent parallel `interface` / `type` definitions that repeat the same property names and semantics as Prisma models.
- **Prefer** types from **`@prisma/client`**: models, enums, and `Prisma` namespace helpers (e.g. `Prisma.ModelGetPayload`, `Prisma.XxxArgs`).
- **Compose** with `Pick`, `Omit`, and `ReturnType` / `Awaited<ReturnType<typeof someQuery>>` so the compiler stays tied to the schema. If you need a subset, derive it from the model or from a named `select` payload type instead of a hand-written duplicate.
- **Zod (or similar)** is fine for runtime validation and forms; use **`z.infer<typeof schema>`** as the TS type so you still have a single definition, not a second interface that mirrors the same fields.
- **OK:** small **UI-only** props (e.g. `isOpen`, `onClose`) that are not meant to mirror DB rows.

---

### Database migrations (Prisma)

- Do **not** add or edit SQL under `prisma/migrations/` by hand when implementing schema changes, unless someone explicitly asks for a custom/manual migration.
- After changing `prisma/schema.prisma`, create migrations with the Prisma CLI, for example:

  `npx prisma migrate dev --name <short_description>`

  so the migration matches what Prisma generates and stays reviewable.
- If you only update the schema file, tell the user to run `migrate dev` (or run it in the project when appropriate) instead of authoring new migration files from scratch.
