# Design doc — Issue #74: a parcel handled by more than one user

## Glossary

| Term | Meaning |
| --- | --- |
| Member | A user linked to a parcel. Every member sees the parcel, all its treatments and its stage, and can treat it. |
| Creator | The user who created the parcel (`Parcel.userId` today). Stays stored; the only user who can delete or edit the parcel (see decision D3). |
| Author | The user who recorded a treatment (`Treatment.userId`). Unchanged by this work. |
| Access rule | "A user can see a parcel if they are one of its members." One helper applies it everywhere. |
| Aggregations | The pre-computed substance totals behind the dashboard (`UserSubstanceAggregation`) and the parcel page (`ParcelSubstanceAggregation`). |

## Context

Let several users share a parcel, e.g. two family members or a grower and an employee who treat the same vineyard. Source: [cpelican/agricolala#74](https://github.com/cpelican/agricolala/issues/74) — "A parcel should be handled by more than one user" (open, no comments).

What the issue asks for:

- A parcel can belong to **more than one user**.
- Each user sees **every treatment on their parcels**, including the ones another user recorded.
- On the dashboard, substance use counts **the treatments on the parcels the user has**, not the treatments the user recorded.
- Users are linked to a parcel **directly in Supabase**; no screen to manage it.

## Status

As of 4 Oct 2026. Design only; nothing started.

| Phase | PR | State |
| --- | --- | --- |
| PR 1 — `ParcelMember` table, backfill, RLS on the new table | — | Not started |
| PR 2 — reads and permission checks go through membership | — | Not started |
| PR 3 — dashboard and parcel aggregations per parcel, rebuild script | — | Not started |
| PR 4 — suggestions cron, Excel export, Supabase runbook | — | Not started |

## Current state

A parcel has exactly one owner, `Parcel.userId`, and almost every query filters on the session user's id, either on the parcel or on the treatment. Treatments filtered by `Treatment.userId` are the main gap: they hide another member's treatments even once the parcel is visible.

| Area | Where | What it does today | Gap for #74 |
| --- | --- | --- | --- |
| Data model | `Parcel.userId`, `Treatment.userId` in `prisma/schema.prisma` | One owner per parcel; treatment stores its author | No way to link a second user |
| Parcel list, detail, map | `getParcels`, `getParcelDetail` in `lib/data-fetcher.ts:114`, `:123`; `GET /api/parcels` in `app/api/parcels/route.ts:16` | `where: { userId }` on the parcel | Shared parcel invisible to other members |
| Treatment list | `getTreatments` in `lib/data-fetcher.ts:133` | `where: { userId }` on the **treatment** | Hides treatments other members recorded |
| Create treatment | `createTreatment` in `lib/actions.ts:56` | Checks every selected parcel has `userId = me` | A member cannot treat a shared parcel |
| Delete treatment / parcel | `deleteTreatment` `lib/actions.ts:166`, `deleteParcel` `lib/actions.ts:278` | Only rows with `userId = me` | Needs a rule (D2, D3) |
| Phenology | `createStandaloneObservation`, `getCurrentStagesByParcel`, `getObservationsForPeriod` in `lib/phenology-observations.ts` | `parcel: { userId }` | Members cannot see or record the stage. Observations already hang off the parcel, so no model change |
| Coverage widget | `getTreatmentsWithParcelWeather` in `lib/data-fetcher-coverage.ts:23` | Parcel filtered by `userId`; nested treatments not filtered | Only the parcel filter changes |
| Dashboard totals | `updateSubstanceAggregations` in `lib/update-substance-aggregations/core.ts`; read by `getCachedSubstanceAggregations` in `lib/data-fetcher-aggregations.ts` | Built from the treatments **the user recorded** (`Treatment.userId`), only for the acting user | Exactly what the issue changes. Also, a treatment by user A never refreshes user B's totals |
| Parcel page totals | `ParcelSubstanceAggregation`, same function | Per parcel, but from the acting user's treatments only | Must count every member's treatments on the parcel |
| Treatment suggestions | `app/api/cron/suggest-treatments/route.ts` | Loops users → parcels, creates one TODO per parcel for that user; deletes all TODOs first | Would create one duplicate TODO per member |
| Excel export | `generateTreatmentsExcel` in `lib/excel-export.ts:45` | Treatments where `userId = me` | Misses other members' treatments |
| Supabase RLS | `scripts/supabase-setup.sql` | `auth.uid() = "userId"` on `Parcel` and `Treatment` | Policies must follow membership; new table needs RLS |
| Weather history | `fetch-weather-history` cron | Per parcel, no user | No change |

## Proposed design

Add a `ParcelMember` join table (parcel · user), backfill one row per existing parcel for its creator, and route every "can this user see this parcel?" check through one helper. Treatments keep their author; what a user sees depends on the parcel, not on who treated it.

### Goals and non-goals

- **Goal:** a member sees and treats a shared parcel like their own: list, detail, map, stage, coverage, suggestions, export.
- **Goal:** dashboard and parcel totals count every treatment on the parcels the user is a member of.
- **Goal:** one access rule in one place, so a forgotten `userId` filter is easy to spot in review.
- **Goal:** no visible change for users whose parcels are not shared.
- **Non-goal:** a screen to invite, add or remove members (the issue says Supabase).
- **Non-goal:** roles or permissions (viewer vs editor). Members have the same rights, except that only the creator deletes or edits the parcel (D3) and only a treatment's author deletes it (D2); the explicit table leaves room for a `role` column later.
- **Non-goal:** dropping `Parcel.userId`. It stays as the creator; dropping or renaming it can be a later cleanup.

### Data model

An explicit join model rather than Prisma's implicit many-to-many: it gets a readable table name to insert into from the Supabase dashboard, a `createdAt` to know when someone was linked, and room for a role later.

```prisma
model ParcelMember {
  id        String   @id @default(cuid())
  parcelId  String
  userId    String
  createdAt DateTime @default(now())
  parcel    Parcel   @relation(fields: [parcelId], references: [id], onDelete: Cascade)
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([parcelId, userId])
  @@index([userId])
}

// Parcel:  members ParcelMember[]
// User:    parcelMemberships ParcelMember[]
```

- Migration generated with `npx prisma migrate dev --name add_parcel_member`.
- **Backfill:** every existing parcel needs a row for its creator, or it disappears from its owner's list once PR 2 lands. Run `migrate dev --create-only`, then append one `INSERT INTO "ParcelMember" … SELECT … FROM "Parcel"` to the generated file, so dev, test, CI and prod all get it at `migrate deploy`. This is a hand-edited migration, explicitly approved for this case (Q1).
- `createParcel` (`lib/actions.ts:241`) creates the creator's `ParcelMember` row in the same `prisma.parcel.create` (nested `members: { create: { userId } }`).

### Access rule

New `lib/parcel-access.ts`, the only place that knows how membership works:

```ts
export function parcelAccessWhere(userId: string) {
	return { members: { some: { userId } } } satisfies Prisma.ParcelWhereInput;
}

export function treatmentAccessWhere(userId: string) {
	return { parcel: parcelAccessWhere(userId) } satisfies Prisma.TreatmentWhereInput;
}
```

Every row in "Current state" that filters on `userId` switches to these helpers, except where the author or creator matters: `createTreatment` and the cron keep **writing** `Treatment.userId`, `deleteTreatment` keeps filtering on the author (D2) and `deleteParcel` on the creator (D3). `getParcelDetail` moves from `findUnique({ id, userId })` to `findFirst({ id, ...parcelAccessWhere(userId) })`.

### Decisions

- **D1 — Treatment author shown.** A treatment recorded by another member shows "by <name or email>" on its card (`components/treatments/treatment-card.tsx`) and in the parcel page list. Own treatments show nothing, so single-user accounts look the same as today.
- **D2 — Who deletes a treatment.** Only its author (`Treatment.userId`), as today (decided, Q2). Other members do not see the delete button on that card; `deleteTreatment` keeps its `userId` filter and returns `RESOURCE_NOT_FOUND`. A wrong entry is fixed by asking its author.
- **D3 — Who deletes or edits a parcel.** Only the creator (`Parcel.userId`), never other members (decided, Q4). Other members do not see the delete button; `deleteParcel` returns `ACCESS_DENIED`. Any future rename or redraw action follows the same rule. Removing a member is done in Supabase, like adding one.
- **D4 — Suggested treatments.** The cron loops over parcels instead of users and creates **one** TODO per parcel, visible to all members. Its `userId` is the author of the parcel's last treatment (the TODO repeats that treatment).
- **D5 — Aggregations stay pre-computed.** Keep both tables; change what feeds them (see below). Computing the dashboard on the fly would also work but is a bigger change than #74 needs.
- **D6 — Excel export.** Contains every treatment on the user's parcels, with the same columns as today: no "Applied by" column (decided, Q3).

### Dashboard and parcel totals

- `ParcelSubstanceAggregation` becomes a pure function of the parcel: built from **all** its DONE treatments, whoever recorded them.
- `UserSubstanceAggregation` is built from the treatments on the user's member parcels (`treatmentAccessWhere`), so a shared parcel counts fully for every member, as the issue asks.
- `updateSubstanceAggregations` takes the affected parcel ids and refreshes: those parcels' rows, then the user rows of **every member** of those parcels (not only the session user). Called from `createTreatment`, `deleteTreatment`, `deleteParcel` as today.
- Linking or unlinking in Supabase does not go through the app, so totals go stale. New `npm run aggregations:rebuild [-- --user <email>]` (`scripts/rebuild-aggregations.ts`) recomputes every row, or one user's; the runbook makes it the step after any membership change.

### Supabase

- PR 1: `ParcelMember` gets RLS enabled in `scripts/supabase-setup.sql`: select own rows (`auth.uid() = "userId"`), insert/update/delete only `service_role` or admin.
- PR 2: `Parcel` and `Treatment` select/update policies use membership (`exists (select 1 from "ParcelMember" m where m."parcelId" = … and m."userId" = auth.uid())`) instead of `"userId"`; `ParcelSubstanceAggregation` likewise.
- PR 4 adds a "Share a parcel" section to `readme.md`:
    1. Find both ids: `select id, email from "User"`, `select id, name from "Parcel" where "userId" = '<creator id>'`.
    2. `insert into "ParcelMember" (id, "parcelId", "userId") values (gen_random_uuid()::text, '<parcel>', '<user>');` (`cuid()` is generated by Prisma, not the database; any unique text id works).
    3. Run `npm run aggregations:rebuild` against prod.
    4. To unlink: delete the row, then rebuild.

### Testing

- Vitest: `lib/parcel-access.ts` shapes; schema of the rebuild script's arguments.
- Integration (two users, A creates a parcel, B is linked):
    - B lists, opens and treats the parcel; a third user C gets `RESOURCE_NOT_FOUND`.
    - B sees A's treatments; A sees B's; C sees none.
    - B cannot delete A's treatment but can delete their own (D2); B cannot delete the parcel, A can (D3).
    - After B treats, A's `UserSubstanceAggregation` and the parcel's aggregation include it (`lib/update-substance-aggregations.test.ts`).
    - Cron creates one TODO for the shared parcel, not two (`route-suggest-treatments.test.ts`).
    - B records a stage; A sees it (`lib/phenology-observations.test.ts`).
    - Backfill: after migration every parcel has its creator as member.
- E2e: seed a second user who shares one parcel with `playwright@agricolala.test`; check the shared parcel is listed and the other user's treatment shows "by …" (`e2e/shared-parcel.spec.ts`).

### Delivery phases

Four PRs, each mergeable on its own. Nothing is visible to users until a parcel is actually shared in Supabase, and **no parcel should be shared in prod before PR 4 is merged**, so a half-shipped state is never seen.

1. **PR 1 — Model and backfill.** `ParcelMember` model + migration with creator backfill, `createParcel` writes the creator row, RLS on the new table, backfill integration test. No read changes: no behaviour change.
2. **PR 2 — Access through membership.** `lib/parcel-access.ts`; switch parcel list/detail/map, `/api/parcels`, treatment list, `createTreatment`, `deleteTreatment` (D2, author only; delete button hidden on others' treatments), `deleteParcel` (D3, creator only; button hidden for other members), phenology queries and `recordPhenologyObservation`, coverage fetcher. "by …" label on treatment cards (D1) with en/it strings. RLS on `Parcel` and `Treatment`. Two-user integration tests; e2e spec with a seeded second user.
3. **PR 3 — Totals per parcel.** Aggregation core rewritten as above (D5), refresh for every member, `npm run aggregations:rebuild` script. Integration tests in `lib/update-substance-aggregations.test.ts`.
4. **PR 4 — Background jobs, export, runbook.** Suggestions cron loops over parcels with one TODO each (D4); Excel export over member parcels (D6); readme "Share a parcel" runbook. Cron and export tests.

## Open questions and risks

- [x] Q1 — OK to hand-edit the PR 1 migration to backfill creators? Yes.
- [x] Q2 — Any member deletes any treatment, or only its author? Only its author (D2).
- [x] Q3 — Should the export show who applied each treatment? No (D6).
- [x] Q4 — Can a member who is not the creator rename or redraw the parcel? No, never (D3).

- **Risk — a forgotten `userId` filter** leaks or hides data. Mitigation: one helper, a grep for `userId` in `where` clauses as a PR 2 review checklist, and the C-user integration tests.
- **Risk — stale totals after a Supabase link.** Mitigation: rebuild step in the runbook; totals are also refreshed for all members on the next treatment of that parcel.
- **Risk — cron TODO author.** A TODO shows up for every member but carries one `userId`; the "by …" label on a TODO would be misleading, so TODO cards keep no author label.

## Sources

1. [cpelican/agricolala#74 — A parcel should be handled by more than one user](https://github.com/cpelican/agricolala/issues/74)
2. Code read on `main` as of 4 Oct 2026; files and lines are cited in [Current state](#current-state).
