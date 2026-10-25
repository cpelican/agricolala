# Design doc — Issue #66 & phenology-based disease sensitivity

## Glossary

| Term | Meaning |
| --- | --- |
| LAI (Leaf Area Index) | Leaf surface (one side) per unit of ground surface, in m²/m². LAI = 4 means 4 m² of leaves above each m² of soil. The app uses it to turn a copper dose in g/ha into a deposit in mg/m² of leaf. |
| Phenological stage | A visible step in the vine's yearly cycle (bud break, flowering, veraison…). |
| BBCH scale | Standard two-digit code for phenological stages (00 = dormant bud, 65 = full flowering, 81 = start of ripening, 89 = ripe). |
| Fruit set (nouaison, allegagione) | Flowers turn into small berries after flowering. |
| Bunch closure | Berries grow until they touch each other and the bunch closes. |
| Veraison (véraison, invaiatura) | Berries soften and change colour; ripening starts. |
| Ontogenic resistance | Resistance that a tissue gains with age, e.g. berries become hard to infect a few weeks after bloom. |
| Rachis / pedicel | The bunch's main stem / the small stalk of each berry. |
| Primary infection | The first infections of the season, from spores that overwintered in the soil or on the wood. |
| 3×10 rule | Rule of thumb for the first downy mildew infections: shoots ≥ 10 cm, ≥ 10 mm rain, about 10 °C. |
| Wash-off | Share of the fungicide deposit removed by rain. |

## Context

Let growers record each parcel's phenological stage (e.g. "flowering") so the app knows when vines are most susceptible to disease. Source: [cpelican/agricolala#66](https://github.com/cpelican/agricolala/issues/66) — "The user should inform the system about the phenological stage" (open, no comments).

What the issue asks for:

- An entry point **inside the treatment modal**.
- A choice between **simple, visual stage summaries** of how the grapes look ("blossom", etc.), each mapped to a precise phenological stage.
- A stored record of **parcel · stage · date**.
- Goal: give the system better knowledge of the vine's sensitivity to diseases.

## Status

As of 25 Oct 2026. v1 is done: growers record the stage and it shows in the Excel export. v2 is done: the per-stage disease levels are stored (P6), the substance cards flag the critical period of the diseases they target (P1), and a disease risk section at the top of the dashboard shows each disease's risk by stage (P2). v3 is under way: since #83, treatment suggestions and the coverage notice follow each parcel's stage, and flowering brings the bee rules to the suggestions and the treatment modal (P4, P10); since #85 the spray-weather widget opens from the parcel's recorded stage instead of March, and at flowering recalls that sprays are evening-only (P8, P10). v3 PR 3 divides the copper deposit by each parcel's leaf area at its stage instead of a full canopy (P3).

| Phase | PR | State |
| --- | --- | --- |
| v1 · PR 1 — model, helpers, actions | [cpelican/agricolala#69](https://github.com/cpelican/agricolala/pull/69) | Merged 28 Sep 2026 |
| v1 · PR 2 — stage picker in the modal and on the parcel pages | [cpelican/agricolala#70](https://github.com/cpelican/agricolala/pull/70) | Merged 4 Oct 2026 |
| v1 · PR 3 — "Phenological stage" column in the Excel export (P9) | [cpelican/agricolala#72](https://github.com/cpelican/agricolala/pull/72) | Merged 4 Oct 2026 |
| v2 · PR 1 — `DiseaseStageSensitivity` table seeded from the matrix (P6) | [cpelican/agricolala#73](https://github.com/cpelican/agricolala/pull/73) | Merged 24 Oct 2026 |
| v2 · PR 2 — stage-aware protection pill and "Critical period" chip (P1) | [cpelican/agricolala#79](https://github.com/cpelican/agricolala/pull/79) | Merged 24 Oct 2026 |
| v2 · PR 3 — disease risk section on the dashboard (P2) | [cpelican/agricolala#80](https://github.com/cpelican/agricolala/pull/80) | Merged 24 Oct 2026 |
| v3 · PR 1 — stage-driven treatment suggestions and bee rules at flowering (P4, P10) | [cpelican/agricolala#83](https://github.com/cpelican/agricolala/pull/83) | Merged 24 Oct 2026 |
| v3 · PR 2 — treatment window from bud break and evening-only reminder at flowering (P8, P10) | [cpelican/agricolala#85](https://github.com/cpelican/agricolala/pull/85) | Merged 25 Oct 2026 |
| v3 · PR 3 — copper readout scaled by the stage leaf area (P3) | PR_P3_LINK | In review |
| v3 · PR 4 – v4 | — | Not started |

## Current state

Since #69, #70 and #72 the app records each parcel's stage and exports it. Since #73 it stores each disease's level per stage; since #79 the substance cards read it ("Critical period" chip, earlier "Re-treat soon"), and since #80 a disease risk section at the top of the dashboard shows each disease's risk by stage. Since #83 the treatment suggestions and the coverage readout follow each parcel's stage instead of the month, with the bee rules at flowering, and since #85 the spray-weather widget opens from the parcel's stage and recalls the evening-only rule at flowering. v3 PR 3 scales the copper mg/m² readout by each parcel's leaf area at its stage. The month windows and the full canopy remain for parcels without a current stage.

| Area | Where | What it does today | Phenology gap |
| --- | --- | --- | --- |
| Disease windows | `Disease.sensitivityMonthMin/Max` in `prisma/schema.prisma`; seeded in `prisma/seed.ts` | Oidium = months 4–8, Peronospora = months 3–7, same for every parcel and year | An early or late season shifts real risk by 2–4 weeks; months cannot express "flowering". #73 added `DiseaseStageSensitivity` and `isDiseaseActive`; #83 calls it per parcel (`getActiveDiseaseIds`), so the month fields only apply to parcels without a current stage |
| Treatment suggestions | `app/api/cron/suggest-treatments/route.ts` + `buildTreatmentSuggestion` in `lib/treatment-suggestions.ts` | Re-proposes last products once `daysBetweenApplications` has elapsed, if a disease they fight is active at the parcel's stage (month window without one) | Done in #83 (P4, P10): tighter cadence around bloom, no restricted products during flowering |
| Coverage widget | `lib/coverage-helpers.ts` | Residual dose after rain wash-off and time decay; copper converted to mg/m² with a fixed LAI = 4 (`COPPER_LEAF_AREA_FACTOR`) | Measured LAI in 4 California vineyards ran from 0.7–1.0 early in the season to 2.4–4.0 at full canopy around veraison ([Kang et al. 2022, Irrigation Science](https://pmc.ncbi.nlm.nih.gov/articles/PMC9509311/)); leaves grown after a spray carry no deposit. v3 PR 3 (P3): LAI = 4 scaled by each parcel's leaf-area share at its stage (`LEAF_AREA_SHARE_BY_STAGE`) |
| Protection pill / advice | `components/substances/coverage-headline.tsx` | "Re-treat now / soon / protected" from thresholds + 3-day rain forecast | Done in #79: "Critical period" chip in the card header, and "Re-treat soon" earlier during critical stages (P1). #80 moved the stage line to the dashboard's disease risk section and made the card's disease badges always visible |
| Treatment modal | `components/treatments/add-treatment-dialog-form.tsx`, `createTreatmentSchema` in `lib/actions-schemas.ts` | Date, parcels, products + doses, diseases, water dose | Done in #70: optional stage field (`treatment-stage-field.tsx`). #83: bee reminder at flowering and a warning under restricted products (P10) |
| Treatment window | `lib/applicability.ts`, shown by `components/treatments/applicability.tsx` on the parcel page | Next 3 days' wind and rain checks, from the parcel's stage (months 3–10 without one). #85 also fixed the day rule, which was inverted (a calm wind at either height, or 25 mm of rain or more, made a day "Applicable"): a day is now applicable when the 10 m wind is below 15 km/h and the rain below 25 mm (`isTreatmentApplicable`), and the card's "Avg Wind" shows that 10 m wind instead of the 10 m / 180 m average | Done in #85 (P8, P10): opens from the parcel's stage, dormant until bud break is recorded, evening-only reminder at flowering |

## Proposed design for #66

Shipped in #69, #70 and #72; the subsections below describe what was built, with the changes made during review.

Add an optional, picture-based "How do your vines look?" step to the treatment modal that writes one `PhenologyObservation` (parcel · stage · date) per selected parcel.

### Goals and non-goals

- **Goal:** record the stage in under 5 seconds, without knowing the BBCH scale.
- **Goal:** keep stage history per parcel, so any feature can ask "what stage was parcel X at on date D?".
- **Goal:** store the precise BBCH code behind each simple choice, so later features can reason on it.
- **Non-goal (v1):** predicting the stage automatically from temperature (see Propositions, P5).
- **Non-goal (v1):** per-grape-variety sensitivity.

### Simple stages shown to the user

Eight choices, each an illustration + one plain label. The BBCH range is stored in code, not shown.

| Enum value | Label shown (en) | What the grower sees | BBCH |
| --- | --- | --- | --- |
| `BUD_BREAK` | Buds opening | Green tip visible through the wool | 05–09 |
| `LEAVES_UNFOLDING` | First leaves | 2–6 leaves spread out, shoots < 20 cm | 11–16 |
| `FLOWER_CLUSTERS` | Flower clusters visible | Clusters separated, flowers still closed | 53–57 |
| `FLOWERING` | Flowering | Caps (calyptras) falling, pollen visible | 60–69 |
| `FRUIT_SET` | Small berries | Berries set, up to pea size | 71–75 |
| `BUNCH_CLOSURE` | Bunch closing | Berries touch each other | 77–79 |
| `VERAISON` | Colour change | Berries soften and change colour | 81–85 |
| `RIPE` | Ripe / harvested | Ready for harvest or picked | 89–91 |

Dormancy (BBCH 00–03) is implied when no observation exists for the current season.

Picture options; all are kept small so the modal does not need much scrolling:

![Three compact ways to show the 8 vine stages: A outline pictograms, B coloured pictograms (chosen), C compact stepper](images/phenological-stage-pictures.svg)

- **A · Outline pictograms**: monochrome line drawings (~40 px), same style as the app's icons; two rows of 4 on a phone.
- **B · Coloured pictograms**: green shoots, yellow flowers, berries turning green to purple (~40 px); two rows of 4 on a phone.
- **C · Compact stepper**: one line of 8 dots; only the picked stage shows its picture and name.

Decision: option B, coloured pictograms (drawn in-house as small SVG icons).

### Data model

A separate model rather than a column on `Treatment`: the stage belongs to the parcel at a date, a grower can observe it without treating, and one treatment can cover several parcels. It holds only parcel, stage and date (decided in review of #69): the owner comes from the parcel, and the stage at a treatment is the parcel's latest observation on or before the treatment date.

```prisma
enum PhenologicalStage {
  BUD_BREAK
  LEAVES_UNFOLDING
  FLOWER_CLUSTERS
  FLOWERING
  FRUIT_SET
  BUNCH_CLOSURE
  VERAISON
  RIPE
}

model PhenologyObservation {
  id         String            @id @default(cuid())
  parcelId   String
  stage      PhenologicalStage
  observedAt DateTime
  createdAt  DateTime          @default(now())
  updatedAt  DateTime          @updatedAt
  parcel     Parcel            @relation(fields: [parcelId], references: [id], onDelete: Cascade)

  @@index([parcelId, observedAt])
}
```

Migration generated with `npx prisma migrate dev` (no hand-written SQL). `lib/phenology.ts` holds the stage order, `PHENOLOGY_STAGE_BBCH` (enum → BBCH range), the 14-day hint and 21-day expiry rules, and `getStageAt` (stage of a parcel at a date). The pictograms live in `components/phenology/stage-icon.tsx`.

### UX in the treatment modal

1. New optional block after the date: "How do your vines look?" with 2 rows of 4 illustrated tiles. One stage per treatment, recorded for every selected parcel (decided).
2. Nothing is selected by default (changed in #70): the selected parcels' last stage, as of the treatment date, is only **suggested** with a dashed outline. If it is older than 14 days, the next stage is suggested instead; after 21 days the stage expires, the parcel shows "Stage unknown" and nothing is suggested. A stage is saved only when the grower taps it, so an untouched picker never re-records a stage and a backdated treatment does not get today's stage.
3. "Skip" is always possible; the treatment is saved without an observation.
4. If the chosen stage is earlier than the last recorded one, show a soft warning ("Earlier than what you recorded on 12 May — correct?"), never a blocker.
5. Parcel pages, for observations without a treatment (server action `recordPhenologyObservation` in `lib/actions-phenology.ts`):
    - List card: current stage or "Stage unknown", plus a dashed **Mark <next stage>** pill; when the stage is unknown or ripe, the pill opens the full **Update stage** picker.
    - Detail page: "Growth stage" with "Set N days ago" and the 8 stages as tiles.
    - Tapping a tile or the pill opens a confirmation dialog (picture, description, current stage); only **Confirm** records it. A newer observation also corrects a wrong one.

### Server changes

- `createTreatmentSchema`: optional `phenologicalStage`.
- `createTreatment` in `lib/actions.ts`: in the same transaction, one observation per `parcelIds` entry with `observedAt = appliedDate`.
- DB queries in `lib/phenology-observations.ts`: observations for a treatment, a standalone observation (own parcels only), the current stage per parcel, and the observations for a period (used by the export).
- Fetcher `getStageByParcel(userId)` in `lib/data-fetcher.ts`: latest non-expired observation per parcel as of now, cached like the other fetchers. An observation older than 21 days (`STAGE_EXPIRES_AFTER_DAYS`) counts as expired: the parcel has no current stage and every stage-based calculation (P1–P4, P8, P10) falls back to today's month windows (P8 adds one exception, a parcel still dormant this season, see P8). Types derived from the query (`Awaited<ReturnType<…>>`), not a hand-written interface.
- Excel export (`lib/excel-export.ts`, v1 PR 3): "Product Applications" sheet gets a `phenologicalStage` column, e.g. "Flowering (BBCH 60–69)": the parcel's stage on the treatment date, by the same rule (latest observation on or before the date, empty if none or expired). English labels, like the rest of the export.
- i18n: stage labels and descriptions in `locales/en.json` and `locales/it.json`.

### Testing

- Vitest: schema accepts/omits the stage; `lib/phenology.test.ts` (stage ordering, next stage, staleness, `getStageAt`).
- Integration (`lib/phenology-observations.test.ts`): one observation per treated parcel, other users' parcels refused, latest vs expired vs future observations, observations for an export period.
- E2e (`e2e/phenology-stage.spec.ts`): a stage picked in the modal is suggested (not saved) next time; Update stage then Mark next stage from the parcel card; detail tile with Cancel then Confirm.

## Research: disease sensitivity by phenological stage

The literature agrees on one window: bunches are most at risk from about 2 weeks before bloom to 3–4 weeks after it, for downy mildew, powdery mildew and black rot alike ([UMD Extension](https://extension.umd.edu/resource/pre-bloom-post-bloom-disease-management)). Italian guidance names flowering and fruit set as the critical moment for both mildews ([Terra e Vita, 2021](https://terraevita.edagricole.it/agrofarmaci-difesa/vite-fioritura-oidio-peronospora/)). Outside that window, fruit gains ontogenic (age-related) resistance, while leaves stay partly susceptible all season; French and Italian extension sources place the end of bunch risk later, at veraison.

### Findings per disease

- **Downy mildew (Peronospora, *Plasmopara viticola*).** Berries were infected and sporulated until 2 weeks after bloom; pedicels stayed susceptible until 4 weeks after bloom ([Kennelly et al. 2005, *Phytopathology*](https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=EXT_ID:18943556%20OR%20EXT_ID:18942976&resultType=core&format=json)). Young leaves, shoot tips and young inflorescences are the most attacked tissues ([UC IPM — Downy mildew](https://ipm.ucanr.edu/agriculture/grape/downy-mildew/)). After fruit set, infection enters through the pedicel or the stomata of small berries ([ARSAC, 2023](https://www.arsacweb.it/peronospora-della-vite-consigli-controllo-avversita/)): young berries show "rot gris", later ones "rot brun", and berries stop being receptive only after veraison ([IFV Occitanie](https://www.vignevin-occitanie.com/le-mildiou-de-la-vigne/)). Primary infections follow the "3×10 rule": shoots ≥ 10 cm (about BBCH 13), ≥ 10 mm rain in 24–48 h, mean temperature ≥ 10 °C ([ARSAC, 2023](https://www.arsacweb.it/peronospora-della-vite-consigli-controllo-avversita/); [downy mildew warning system, *Electronics*](https://www.mdpi.com/2079-9292/11/3/356)); IFV gives 11 °C for oospore germination, with 10–20 days of incubation.
- **Powdery mildew (Oidium, *Erysiphe necator*).** Only clusters inoculated within 2 weeks of bloom developed severe disease ([Gadoury et al. 2003, *Phytopathology*](https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=EXT_ID:18943556%20OR%20EXT_ID:18942976&resultType=core&format=json)). Berries are highly susceptible 1–2 weeks after set and strongly resistant about 3–4 weeks after bloom; leaves are most susceptible when half expanded and never become immune ([Gadoury et al. 2012 review, *Mol. Plant Pathol.*](https://pmc.ncbi.nlm.nih.gov/articles/PMC6638670/)). IFV puts the bunch peak at "fin floraison – début nouaison" and says vines are much less sensitive after veraison ([IFV — Oïdium](https://www.vignevin.com/publications/fiches-pratiques/oidium/)); ARSAC lists pre-flowering, post-flowering and up to veraison as the most sensitive period ([ARSAC, 2020](https://www.arsacweb.it/oidio-della-vite-conoscere-lavversita-per-poterla-controllare/)). These field guides are more conservative than the trials (existing colonies keep growing, leaves stay susceptible), so the app should keep sulfur suggestions until veraison.
- **Black rot (*Guignardia bidwellii*).** Inflorescences can be infected before bloom; highest berry susceptibility runs from fruit set to the start of bunch closure; infections succeed until the end of bunch closure; resistance appears clearly before veraison ([Molitor & Berkelmann-Löhnertz 2011, *Crop Protection*](https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=%22Simulating%20the%20susceptibility%20of%20clusters%20to%20grape%20black%20rot%22&resultType=core&format=json)). Not in the app's catalogue today; no French or Italian source checked.
- **Botrytis bunch rot (*Botrytis cinerea*).** Flowers are infected through the stigma and receptacle scars and the infection stays latent until ripening; susceptibility rises again from veraison, especially above 92 % relative humidity with wet fruit; key sprays are bloom, pre-bunch closure, veraison and pre-harvest ([UC IPM — Botrytis](https://ipm.ucanr.edu/agriculture/grape/botrytis-bunch-rot/)). Not in the app's catalogue today; no French or Italian source checked.

### Sensitivity matrix (app stages)

Qualitative synthesis of the sources above, mapped to the 8 stages proposed for #66. "Fruit" and "leaves" differ for the mildews, so the level shown is for the bunch; leaf risk is noted where it matters. BBCH codes follow [Lorenz et al. 1995](https://onlinelibrary.wiley.com/doi/pdf/10.1111/j.1755-0238.1995.tb00085.x).

| Stage (BBCH) | Downy mildew | Powdery mildew | Black rot | Botrytis |
| --- | --- | --- | --- | --- |
| Buds opening (05–09) | None — shoots < 10 cm | Low | Low | None |
| First leaves (11–16) | Medium — primary infections once shoots ≥ 10 cm | Medium (leaves) | Medium (leaves) | None |
| Flower clusters visible (53–57) | High | Medium–High | Medium | Low |
| Flowering (60–69) | Very high | Very high | High | High (latent infections) |
| Small berries (71–75) | Very high until ~2 weeks post-bloom; pedicels until ~4 weeks | Very high 1–2 weeks after set, then falling | Very high | Low |
| Bunch closing (77–79) | Low–Medium: berries resist, but brown rot (rot brun) via pedicels/rachis until veraison; leaves at risk | Low for berries, leaves still at risk | Medium — ends at end of closure | Medium–High (last pre-closure spray) |
| Colour change (81–85) | Low (late leaf infections possible) | Low | None | High |
| Ripe / harvested (89–91) | Low | Low | None | Very high if rain or wounds |

### What this means for the current calendar windows

- Seeded windows (Peronospora months 3–7, Oidium months 4–8) roughly bracket the critical period, but bloom can move by 2–3 weeks between years and sites, so a month cannot tell "pre-bloom" from "4 weeks post-bloom".
- Downy mildew cannot infect before shoots reach ~10 cm, so March is often too early; late-summer leaf infections after July are not covered by month 7.
- The coverage model's fixed leaf area (LAI = 4, `COPPER_LEAF_AREA_FACTOR`) fits a full canopy; around bud break the canopy is several times smaller (approximate, typical values LAI < 1), and every new leaf since the last spray is unprotected.

### Leaf area by stage

Measured leaf area stays well under the app's fixed LAI = 4 until veraison. Swiss dosing guidance scales fungicide doses to about 38 % of the full-canopy dose at the first sprays, 75 % at flowering and 100 % after flowering.

| App stage (BBCH) | Measured LAI, Italy ([Orlando et al. 2016](https://pmc.ncbi.nlm.nih.gov/articles/PMC5190985/)) | Dose vs full canopy, Switzerland ([Agridea 2011, after Viret & Siegfried, Agroscope](https://www.bonnepratiqueagricole.ch/fileadmin/Viticulture/Maladies/Dosage_des_fongicides_en_fonction_du_stade_phenologique.pdf)) |
| --- | --- | --- |
| First leaves (11–16) | Not measured | 38 % (first spray, "1er rougeot") |
| Flower clusters visible (53–57) | 0.13–0.61 (BBCH 56), 0.16–0.75 (BBCH 57) | 50–63 % (1st and 2nd pre-flowering sprays) |
| Flowering (60–69) | 0.22–1.09 (BBCH 61) | 75 % |
| Small berries (71–75) | 0.30–1.24 (BBCH 74) | 100 % (post-flowering) |
| Bunch closing (77–79) | 0.45–1.41 (BBCH 77) | 100 % |
| Colour change (81–85) | 0.64–1.41, one vigorous plot 2.84 (BBCH 81) | 100 % |

- Orlando et al. measured Barbera and Chardonnay near Pavia (Italy); full-canopy LAI in the Agridea table reaches 2.57, and California vineyards reached 2.4–4.0 ([Kang et al. 2022](https://pmc.ncbi.nlm.nih.gov/articles/PMC9509311/)). So LAI = 4 is the top of the measured range, not a typical value.
- Italian and French practice confirm the early-season gap: leaf-wall-area dosing lets the first downy mildew sprays cut the per-hectare dose by more than half ([Terra e Vita, 2022](https://terraevita.edagricole.it/agrofarmaci-difesa/peronospora-prodotti-dosati-sulla-base-dellarea-fogliare/)), and IFV's Optidose tool adapts doses to stage and leaf area ([Ephytia — INRAE](http://ephytia.inra.fr/fr/C/24093/Vigne-Adaptation-des-doses-a-la-vegetation-a-proteger)).

## Propositions

Once the stage is known, the biggest wins are saying *when* protection matters, once per disease on the dashboard (P2) and on each substance card for the diseases it targets (P1), and replacing month windows with stage windows (P4, P6). Ordered by suggested priority. Every stage-based risk readout uses words ("higher risk", "critical period"), never numbers, and carries the same "experimental" label as coverage. The reminder that timing varies with grape variety and climate lives in that label's tooltip (one sentence), not as extra text on the card, so the UI stays short and readable.

| # | Proposition | Where in the code | What the grower gets |
| --- | --- | --- | --- |
| P1 | **Stage-aware protection pill.** Show the parcel's stage and a "Critical period" chip in the substance card header when a disease the substance targets is High/Very high. During critical stages, advise "Re-treat soon" earlier: when today's dose or the 3-day projection drops below 75 % of the full dose instead of the 50 % threshold (sulfur). Copper's threshold already is its full dose (2.5 mg/m² = 100 g/ha), so it keeps a 25 % margin instead: below 2.5 / 0.75 ≈ 3.3 mg/m². The cards are for all parcels, so the stage used is the one with the highest level among the parcels' current stages (latest observation on ties). The card header always names the diseases the substance targets, so the grower knows what it fights (decided in review of #80); with no current stage they are neutral badges. The diseases critical at that stage share a red badge (e.g. "⚠ Downy mildew"), next to the experimental label; tapping it opens a "Critical period" popover explaining why ("Flowering is a critical period for downy mildew…") with the variety-and-climate sentence (a popover, so it works on phones). | `getSubstanceStageRisk` in `lib/disease-stage-sensitivity.ts`; `getRetreatAdvice` / `getCoverageHeadline` in `components/substances/coverage-headline.tsx`; badges in `components/substances/disease-badges.tsx`; `Substance.diseases` gives the link | Same residual dose reads "fine" at bud break but "act now" at flowering |
| P2 | **Disease risk section at the top of the dashboard.** One row per disease of the catalogue with a matrix row: its name, then a thin band of the 8 stages coloured by its level (grey = none, green = low, yellow = medium, orange = high, red = very high), the current stage ringed and the other stages faded. The section header shows the vines' stage once (pictogram and name), with the experimental label; the stage is the riskiest among the parcels' current stages, as in P1, and the section is hidden when no parcel has a current stage. Disease names stay neutral: the red band already signals a critical period, and the substance cards carry the red badge. Tapping a row opens a popover with the critical-period explanation when it applies, each stage's level in words, and the variety-and-climate sentence. Decided in review of #80: first drafted as a strip in each substance card, moved to its own section because risk by stage belongs to the disease, not the substance (a substance targeting two diseases blended them into one band, and the stage was repeated on every card); one band per disease kept even though both mildews look alike today, so diseases with other shapes (e.g. botrytis) fit later; dots for past treatments dropped as too hard to read. | `getDiseaseRiskTimeline` in `lib/disease-stage-sensitivity.ts`; section in `components/phenology/disease-risk-section.tsx`, rendered first by `components/async/home-dashboard-content.tsx` | Sees at a glance which disease is at risk now, and how risk changes over the season |
| P3 | **Canopy-aware copper readout.** Scale the fixed LAI = 4 by the Swiss stage fractions (38 % first leaves → 75 % flowering → 100 % after flowering, see "Leaf area by stage") in `COPPER_LEAF_AREA_FACTOR`, and add a "new growth" dilution term during fast shoot growth (first leaves → bunch closing). Built in v3 PR 3: each parcel's copper g/ha is divided by LAI = 4 × its leaf-area share at its current stage, then the mg/m² is area-weighted across parcels (the g/ha figures are unchanged). Shares: 38 % for buds opening and first leaves (the table has no lower value, and a smaller one would inflate the readout), 63 % for flower clusters (top of the 50–63 % range: more leaves gives the lower, safer mg/m²), 75 % at flowering, 100 % from small berries on; parcels without a current stage keep the full canopy. The share comes from today's stage, not the spray's, so copper sprayed at first leaves reads diluted once the parcel is marked flowering: that is the dilution term, one step per stage. Growth between two stages is not modelled, and the 3-day projection keeps today's leaf area (`projectedLeafSurfaceMgPerM2`, computed server-side so the card and pill no longer divide by LAI = 4). The 2.5 mg/m² threshold and the 100 g/ha full dose stay as they are. | `LEAF_AREA_SHARE_BY_STAGE` and `getCopperLeafAreaFactor` in `lib/coverage-helpers.ts` (`calculateCoverageData`, forecast projection), stages from `getStageByParcel` in `lib/get-coverage-widget-data.ts`; read by `components/substances/coverage-headline.tsx` and `coverage-residual-panel.tsx` | Early-season mg/m² no longer under-reported; mid-season decay reflects unprotected new leaves |
| P4 | **Stage-driven treatment suggestions.** Filter active diseases by stage instead of month; in Very-high stages, suggest the next treatment at the shortest label interval, aiming for just before flowering starts (during flowering, only bee-compatible fungicides, see P10); stop suggesting sulfur for bunches after bunch closure. The season-wide notice above the substance cards ("Protection isn't tracked right now: no disease is active at this time of year") then follows the same stage rule and moves into the disease risk section header (P2): until then it can contradict the section, e.g. a month outside the windows while the section flags flowering as critical. Built in #83: a disease is active on a parcel from Medium at its stage (month window without one), and the coverage readout counts it if it is active on any parcel. The cadence is "critical" when a treated disease is Very high at the parcel's stage or the next one (so flower clusters, flowering, small berries): every product of the last treatment comes back as soon as the shortest label interval has elapsed, to be done within 3 days (`CRITICAL_SUGGESTION_WINDOW_DAYS`) instead of a whole extra interval; there is no flowering date to aim at before P5, so the stage before flowering counts as critical. Sulfur stops at colour change, where Oidium drops to Low. A suggestion now lists only the diseases still active. The notice shows in the section header when the section is shown, and stays above the cards otherwise. | `buildTreatmentSuggestion` in `lib/treatment-suggestions.ts`, called by `app/api/cron/suggest-treatments/route.ts`; `getActiveDiseaseIds` in `lib/disease-stage-sensitivity.ts` with `getCachedDiseaseWindows` (replaces `getCurrentDiseases`), also used by `lib/get-coverage-widget-data.ts`; notice in `components/phenology/disease-risk-section.tsx` | Fewer pointless reminders early and late, tighter reminders around bloom |
| P5 | **Stage estimate from temperature.** Use the daily temperatures already stored in `WeatherHistory` to accumulate thermal time and predict the next stage, then ask "Your vines are probably flowering — confirm?". Phenology models such as GFV/GSR ([Parker et al., via Europe PMC](https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=%22Grapevine%20Flowering%20Veraison%20model%22%20OR%20%22Grapevine%20Sugar%20Ripeness%22&resultType=core&format=json&pageSize=5)) are based on thermal time. | New `lib/phenology-estimate.ts` + weather cron `app/api/cron/fetch-weather-history` | Stage stays current even when the grower forgets to update it |
| P6 | **Stage-based disease catalogue.** Add a `DiseaseStageSensitivity` table (disease · stage · level), seeded from the matrix above (ranges rounded up, e.g. both mildews Medium at bunch closing). When a parcel's stage is unknown or expired, stage sensitivity is ignored and the month fields apply. | `prisma/schema.prisma`, `prisma/seed.ts`, `lib/data-fetcher-catalog.ts`, `lib/disease-stage-sensitivity.ts` | One source of truth for P1, P2, P4 |
| P7 | **Copper budget pacing.** In the cumulated-dose section, show how much of the yearly copper limit (4 kg/ha) is left for the flowering → bunch-closure window. | `components/substances/cumulated-dose-section.tsx` | Avoids exhausting the copper allowance before the critical window |
| P8 | **Treatment window from bud break.** Start the applicability check at the first observed "Buds opening" instead of month 3. Built in #85, per parcel, from its latest observation on or before today: with a current stage the widget is shown in any month (an early bud break in February opens it); if the latest observation is from a previous season and none was recorded this year, the vines are taken as dormant and, within months 3–10, the widget is replaced by "No stage recorded yet this season: mark 'Buds opening' under Growth stage…" (the parcel page holds those tiles); otherwise (never tracked, or this season's stage expired) months 3–10 apply as before. A parcel is tracked only once it has an observation, so growers who never record a stage see no change. The season is the calendar year, which fits the northern-hemisphere vineyards the app targets. | `getTreatmentSeason` in `lib/applicability.ts`, `getLatestObservation` in `lib/phenology-observations.ts`; `components/treatments/applicability.tsx` | No spray-weather widget in a dormant vineyard |
| P9 | **Stage in the Excel export.** Add a "Phenological stage" column to exported treatments. | `lib/excel-export.ts` | Field-register (quaderno di campagna) readiness and traceability |
| P10 | **Bee-protection rules at flowering.** When a parcel is at "Flowering", show a reminder in the treatment modal and never suggest insecticides/acaricides. Italy (L. 313/2004 + regional laws): insecticides and acaricides are banned from flower opening to petal fall; fungicides are allowed only without a bee-hazard label, and some regions add conditions. France (arrêté of 20 Nov 2021; vines classed as attractive to bees since the Conseil d'État decision of 26 Apr 2024): every product, fungicides included, only from 2 h before to 3 h after sunset, unless strong disease pressure justifies it and the reason is logged in the spray register. Decision: the app applies the strictest combination everywhere: during flowering, no insecticides/acaricides and no copper, only fungicides without a bee-hazard label, and the spray-weather widget recalls that sprays are allowed only from 2 h before to 3 h after sunset. Built in #83, the spray-weather reminder in #85: `Substance.restrictedAtFlowering` marks the substances to avoid while the vines flower, and a product is restricted when one of its substances is. Seeded: copper, avoided at flowering as good practice (decided in review of #83: flowering lasts only about 4 days and not every grower follows it, so it is advice, not a rule), and sweet orange oil, also registered as an insecticide and acaricide; sulfur is not flagged. The cron never suggests a restricted product to a parcel at "Flowering", so a copper-only treatment gets no suggestion during those few days. In the modal, when the picked stage (or, if none, the suggested one) is "Flowering", a yellow "Flowering: protect the bees" note recalls the rules, and a restricted product gets "Best avoided during flowering" under it; a warning, not a blocker. Production: `npx tsx prisma/seed.ts --flowering-restrictions-only` sets the flags without wiping data. Spray-weather reminder (#85): when the parcel's current stage is "Flowering", the widget shows a "Flowering: to protect the bees, spray only from 2 hours before to 3 hours after sunset" note above the days; the wind and rain checks stay per day. Decided in review of #85: no per-day window with sunset times. Growers know when sunset is, and without notifications they will not check the app at the right hour, so the rule is enough and the app makes no extra weather call. | `isProductAllowedAtStage` in `lib/treatment-suggestions.ts`; `treatment-stage-field.tsx` and `add-treatment-dialog-form.tsx`; `prisma/schema.prisma` (`Substance`), `prisma/seed.ts`; `lib/applicability.ts` and `components/treatments/applicability.tsx` (spray-weather reminder, #85) | Stays compliant while protecting the bunch at its most sensitive stage |

### Delivery phases

Four phases, each usable on its own and built on the previous one. Progress is tracked in [Status](#status); unmarked PRs are planned, not opened yet.

1. **v1 — Capture the stage** (issue #66). Nothing uses the stage yet; we start collecting data.
    1. ✅ PR [#69](https://github.com/cpelican/agricolala/pull/69): `PhenologyObservation` model + migration, `lib/phenology.ts` (stage ↔ BBCH, ordering, next stage, 21-day expiry), `getStageByParcel`, stage saved by `createTreatment` and by a new `recordPhenologyObservation` action; Vitest + integration tests.
    2. ✅ PR [#70](https://github.com/cpelican/agricolala/pull/70): stage picker with the option B pictograms in the treatment modal, stage tiles and "Mark next stage" on the parcel pages; en/it labels; e2e test.
    3. ✅ PR [#72](https://github.com/cpelican/agricolala/pull/72): "Phenological stage" column in the Excel export (P9).
2. **v2 — Use the stage on the dashboard and the substance cards.**
    1. ✅ PR [#73](https://github.com/cpelican/agricolala/pull/73): `DiseaseStageSensitivity` table seeded from the sensitivity matrix, `isDiseaseActive` with month fallback (P6).
    2. ✅ PR [#79](https://github.com/cpelican/agricolala/pull/79): stage-aware protection pill and "Critical period" chip, with the experimental tooltip (P1).
    3. ✅ PR [#80](https://github.com/cpelican/agricolala/pull/80): disease risk section at the top of the dashboard, one row per disease with a per-stage popover; substance cards keep only their disease badges (P2, revises P1's stage line).
3. **v3 — Use the stage in the background jobs and rules.**
    1. ✅ PR [#83](https://github.com/cpelican/agricolala/pull/83): stage-driven treatment suggestions plus bee rules at flowering in the suggestions and the modal reminder (P4, P10).
    2. ✅ PR [#85](https://github.com/cpelican/agricolala/pull/85): treatment window from bud break, a dormant hint until bud break is recorded, an evening-only reminder at flowering in the spray-weather widget, and the fixed "Applicable" day rule (P8, P10).
    3. 🔄 PR PR_P3_PHASE (in review): copper mg/m² readout and its 3-day projection scaled by each parcel's leaf area at its stage (P3).
    4. PR: copper budget pacing in the cumulated-dose section (P7).
4. **v4 — Estimate the stage automatically.**
    1. PR: thermal-time stage estimate from `WeatherHistory` with a "Your vines are probably … — confirm?" prompt, checked against the stages growers entered in v1–v3 (P5).

## Open questions and risks

- [x] Is one stage per treatment enough, or do growers need a different stage per parcel in the same treatment (early vs late parcels)?
- [x] Should the stage picker live only in the modal (as the issue says), or also on the parcel card from v1?
- [x] Who draws the 8 stage illustrations, and do we reuse open BBCH drawings or commission new ones?
- [x] Leaf area per stage for P3: the copper mg/m² readout divides the dose by the leaf area and always assumes a full canopy (LAI = 4). Before P3 changes that formula, find a trusted source (e.g. an IFV or Italian extension table) giving the leaf area at each stage; one study with rough seasonal ranges is not enough.
- [x] Which region's bee rules apply to our users (e.g. Liguria's regional law), and do our copper/sulfur products carry any bee-hazard label?

- **Risk — stale stages:** a stage entered in April is wrong by June. Mitigation: 14-day staleness hint in the modal, 21-day expiry after which the parcel has no stage and calculations fall back to month windows; later P5 estimation.
- **Risk — false precision:** the sensitivity matrix is a qualitative synthesis; the UI should say "higher risk" rather than show numbers, and keep the "experimental" label used for coverage.
- **Risk — variety and climate:** timing of ontogenic resistance varies with climate and cultivar (Kennelly et al. 2005), so levels are guidance, not rules.

## Sources

Pages opened for this doc (as of 27 Sep 2026):

1. [cpelican/agricolala#66 — The user should inform the system about the phenological stage](https://github.com/cpelican/agricolala/issues/66)
2. [Kennelly, Gadoury, Wilcox, Magarey, Seem (2005) — Seasonal development of ontogenic resistance to downy mildew in grape berries and rachises; and Gadoury, Seem, Ficke, Wilcox (2003) — Ontogenic resistance to powdery mildew in grape berries, *Phytopathology* (Europe PMC records)](https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=EXT_ID:18943556%20OR%20EXT_ID:18942976&resultType=core&format=json)
3. [Gadoury et al. (2012) — Grapevine powdery mildew (*Erysiphe necator*): a fascinating system…, *Molecular Plant Pathology* (PMC)](https://pmc.ncbi.nlm.nih.gov/articles/PMC6638670/)
4. [Molitor & Berkelmann-Löhnertz (2011) — Simulating the susceptibility of clusters to grape black rot infections depending on their phenological development, *Crop Protection* 30(12) (Europe PMC record)](https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=%22Simulating%20the%20susceptibility%20of%20clusters%20to%20grape%20black%20rot%22&resultType=core&format=json)
5. [University of Maryland Extension — Pre-bloom to post-bloom disease management](https://extension.umd.edu/resource/pre-bloom-post-bloom-disease-management)
6. [UC IPM — Grape downy mildew](https://ipm.ucanr.edu/agriculture/grape/downy-mildew/)
7. [UC IPM — Botrytis bunch rot](https://ipm.ucanr.edu/agriculture/grape/botrytis-bunch-rot/)
8. [Parker et al. and others — GFV / GSR thermal-time phenology models (Europe PMC search)](https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=%22Grapevine%20Flowering%20Veraison%20model%22%20OR%20%22Grapevine%20Sugar%20Ripeness%22&resultType=core&format=json&pageSize=5)
9. [Kang et al. (2022) — Evaluation of satellite Leaf Area Index in California vineyards, *Irrigation Science* (PMC)](https://pmc.ncbi.nlm.nih.gov/articles/PMC9509311/)
10. [IFV — Fiche pratique Oïdium](https://www.vignevin.com/publications/fiches-pratiques/oidium/)
11. [IFV Occitanie — Le mildiou de la vigne](https://www.vignevin-occitanie.com/le-mildiou-de-la-vigne/)
12. [Triple Performance — Mildiou sur vigne, grappe et inflorescence](https://wiki.tripleperformance.fr/wiki/Mildiou_sur_vigne_%E2%80%93_grappe_et_inflorescence)
13. [ARSAC Calabria (Leto, Maione, Zavaglia, 2023) — Peronospora della vite](https://www.arsacweb.it/peronospora-della-vite-consigli-controllo-avversita/)
14. [ARSAC Calabria (Leto, Maione, 2020) — Oidio della vite](https://www.arsacweb.it/oidio-della-vite-conoscere-lavversita-per-poterla-controllare/)
15. [Terra e Vita (2021) — Difendere la vite in fioritura da oidio e peronospora](https://terraevita.edagricole.it/agrofarmaci-difesa/vite-fioritura-oidio-peronospora/)
16. [Vitisphere (29 Apr 2026) — Protection des pollinisateurs lors de la floraison de la vigne](https://www.vitisphere.com/actualite-106518--le-point-sur-la-protection-des-pollinisateurs-lors-de-la-floraison.html)
17. [Regione Valle d'Aosta — Divieto di trattamenti durante la fioritura (L. 313/2004)](https://www.regione.vda.it/agricoltura/per_gli_agricoltori/apicoltura/divieto_trattamenti_in_fioritura_i.aspx)
18. [Italiafruit News (2018) — Trattamenti in fioritura, ecco cosa fare](https://www.italiafruit.net/trattamenti-in-fioritura-ecco-cosa-fare)
19. [Orlando et al. (2016) — Estimating Leaf Area Index in vineyards using the PocketLAI smart-app, *Sensors* (PMC)](https://pmc.ncbi.nlm.nih.gov/articles/PMC5190985/)
20. [Agridea (2011), after Viret & Siegfried (Agroscope) — Dosage des fongicides en fonction du stade phénologique](https://www.bonnepratiqueagricole.ch/fileadmin/Viticulture/Maladies/Dosage_des_fongicides_en_fonction_du_stade_phenologique.pdf)
21. [Terra e Vita (Crivelli, 2022) — Peronospora, prodotti dosati sulla base dell'area fogliare](https://terraevita.edagricole.it/agrofarmaci-difesa/peronospora-prodotti-dosati-sulla-base-dellarea-fogliare/)
22. [Ephytia (INRAE) — Vigne : adaptation des doses à la végétation à protéger (Optidose)](http://ephytia.inra.fr/fr/C/24093/Vigne-Adaptation-des-doses-a-la-vegetation-a-proteger)

Cited but not opened (blocked to fetching; reference only):

- [Lorenz et al. (1995) — Phenological growth stages of the grapevine, extended BBCH scale, *Aust. J. Grape Wine Res.*](https://onlinelibrary.wiley.com/doi/pdf/10.1111/j.1755-0238.1995.tb00085.x)
- [Grapevine downy mildew warning system based on NB-IoT, *Electronics* 11(3):356 (2022)](https://www.mdpi.com/2079-9292/11/3/356) — source of the 3×10 rule wording
