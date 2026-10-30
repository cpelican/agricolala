# Design doc — Issue #99: running the fermentation from agricolala

## Relevant files

Files the feature reads from, extends or copies patterns from.

| Area | File | Why it matters |
| --- | --- | --- |
| Data model | [prisma/schema.prisma](../prisma/schema.prisma) | New `Fermentation`, `FermentationReading`, `FermentationAddition` models; reads `Parcel`, `Treatment`, `Disease`, `WeatherHistory`, `WeatherHistoryTask` |
| Seed | [prisma/seed.ts](../prisma/seed.ts) | Disease names (Oidium, Peronospora) and substances (Copper, Sulfur) the season summary groups by |
| Server actions | [lib/actions.ts](../lib/actions.ts), [lib/actions-phenology.ts](../lib/actions-phenology.ts) | Pattern for auth + Zod + `revalidatePath`; new `lib/actions-fermentation.ts` sits next to them |
| Validation | [lib/actions-schemas.ts](../lib/actions-schemas.ts) | New schemas for a fermentation, a reading and an addition |
| Data access | [lib/data-fetcher.ts](../lib/data-fetcher.ts) | `getTreatmentsForYear`, `getObservationsForYear`, `getParcels`; DB access stays in data-fetcher, actions and cron modules (#97) |
| Weather history | [lib/weather-history.ts](../lib/weather-history.ts), [lib/cron-fetch-weather-history.ts](../lib/cron-fetch-weather-history.ts) | Daily rain and temperature kept per location from 1 March (`getWeatherSeasonStart`): the source of the season's rain summary |
| Open-Meteo | [lib/open-meteo-client.ts](../lib/open-meteo-client.ts), [lib/open-meteo-schema.ts](../lib/open-meteo-schema.ts) | Daily variables fetched; add `et0_fao_evapotranspiration` for the water balance |
| Rain helpers | [lib/coverage-helpers.ts](../lib/coverage-helpers.ts), [lib/applicability.ts](../lib/applicability.ts) | Existing sums of `cumulativePrecipitation` and the 25 mm wash-off constant |
| Disease risk | [lib/disease-stage-sensitivity.ts](../lib/disease-stage-sensitivity.ts), [components/phenology/disease-risk-section.tsx](../components/phenology/disease-risk-section.tsx) | Disease labels and risk-level colours to reuse in the season summary |
| Phenology | [lib/phenology.ts](../lib/phenology.ts), [lib/phenology-observations.ts](../lib/phenology-observations.ts) | `RIPE` stage dates as a harvest-date hint |
| Substances | [lib/substance-helpers.ts](../lib/substance-helpers.ts), [lib/product-dose-to-grams.ts](../lib/product-dose-to-grams.ts) | Last copper and sulfur applications before harvest |
| Excel export | [lib/excel-export.ts](../lib/excel-export.ts), [lib/actions-export.ts](../lib/actions-export.ts) | A later "Fermentation" sheet |
| Navigation | [lib/app-shell.ts](../lib/app-shell.ts), [components/routing/bottom-navigation.tsx](../components/routing/bottom-navigation.tsx), [components/routing/sidebar-navigation.tsx](../components/routing/sidebar-navigation.tsx) | A fifth entry, "Cellar" |
| Routes | [app/[lang]/(app)/treatments/page.tsx](../app/%5Blang%5D/%28app%29/treatments/page.tsx), [app/[lang]/(app)/parcels/[parcelId]/page.tsx](../app/%5Blang%5D/%28app%29/parcels/%5BparcelId%5D/page.tsx) | List and detail page patterns for `/fermentations` and `/fermentations/[id]` |
| Charts | [components/ui/chart.tsx](../components/ui/chart.tsx) (Recharts), [components/substances/chart-wrapper.tsx](../components/substances/chart-wrapper.tsx) (Chart.js) | The fermentation curve |
| Dialogs | [components/phenology/update-stage-dialog.tsx](../components/phenology/update-stage-dialog.tsx), [components/treatments/add-treatment-dialog-form.tsx](../components/treatments/add-treatment-dialog-form.tsx) | Modal + form patterns for "Add reading" / "Add addition" |
| Translations | [locales/en.json](../locales/en.json), [locales/it.json](../locales/it.json), [lib/i18n](../lib/i18n) | New `fermentation.*` keys |
| Tests | [e2e/TESTING.md](../e2e/TESTING.md), [e2e/phenology-stage.spec.ts](../e2e/phenology-stage.spec.ts), [lib/phenology.test.ts](../lib/phenology.test.ts) | E2e and unit test patterns |
| Related docs | [design-docs/keep-weather-records.md](keep-weather-records.md), [design-docs/phenological-stage.md](phenological-stage.md), [design-docs/shared-parcels.md](shared-parcels.md), [design-docs/coverage_widget.md](coverage_widget.md) | Weather history, stages, parcel access rule, copper/sulfur science |

## Glossary

| Term | Meaning |
| --- | --- |
| Must (mosto, moût) | Crushed grape juice, with or without skins, before and during fermentation. |
| Alcoholic fermentation | Yeasts turn the must's sugar into ethanol and CO₂. Usually one to two weeks. |
| Babo (°Babo, °KMW, Klosterneuburger Mostwaage) | Must-weight scale used in Italy. 1 °Babo ≈ 10 g of grape sugar per kg of must. Read with a hydrometer (mostimetro) calibrated at 15 °C or 17.5 °C. |
| Density / specific gravity | Mass of a litre of must, in g/mL (1.090 at the start, ≈ 0.990–0.995 for a dry wine). Falls as sugar turns into alcohol. |
| Oechsle (°Oe) | (density − 1) × 1000. °Oe = °KMW × (4.54 + 0.022 × °KMW). |
| Fermentation curve | Babo and temperature plotted against time. |
| Lag phase | Hours to days before the Babo reading starts dropping. |
| Sluggish fermentation (fermentazione stentata, fermentation languissante) | The drop slows down well before the must is dry. |
| Stuck fermentation (arresto fermentativo, arrêt de fermentation) | The drop stops with sugar still left. |
| Spontaneous fermentation | Uses the yeasts naturally on the grapes and in the cellar (indigenous yeasts). |
| Inoculated fermentation | Selected dry yeast is added (inoculo, levurage). |
| Pied de cuve | A starter made by the winery itself: a small share of the grapes is picked a few days early and left to ferment spontaneously, then used to start the main vats. Still indigenous yeasts. |
| Biodynamic wine (Demeter) | Wine certified under the Demeter standard: indigenous yeasts by default, a short positive list of cellar inputs, DAP forbidden. Stricter than EU organic. |
| Advice level | How far an advice departs from biodynamic practice: biodynamic → biodynamic with certifier approval → organic → conventional (see "Spontaneous first: the advice ladder"). |
| Yeast hulls (scorze di lievito, écorces de levure) | Yeast cell walls. They soak up toxic fatty acids and pesticide residues and help a slowing fermentation. EU limit 40 g/hL. |
| YAN (azoto prontamente assimilabile, azote assimilable) | Nitrogen yeasts can use. Too little leads to sluggish fermentations and H₂S. |
| H₂S | Hydrogen sulfide, a rotten-egg smell. Elemental sulfur left on the grapes can turn into H₂S during fermentation. |
| SO₂ (solforosa, anidride solforosa, soufre) | Sulfur dioxide, added as gas, solution or potassium metabisulfite. Antioxidant and antimicrobial. Measured as **free** SO₂ (active part) and **total** SO₂ (free + bound); legal limits are on total. |
| Molecular SO₂ | The small, truly active share of free SO₂. It depends on pH: molecular = free / (1 + 10^(pH − 1.81)). |
| Inert gas (argon, nitrogen, CO₂) | Gas used to keep air away from must or wine in tanks, pipes and headspace. |
| Lot / vat (vasca, cuve) | One container of must followed as one fermentation. |

## Context

Let a grower follow their fermentation in the same app as their vineyard. Source: [cpelican/agricolala#99](https://github.com/cpelican/agricolala/issues/99) — "We would like to be able to conduct the fermentation from agricolala." (open, no comments).

What the issue asks for (translated from the Italian parts):

- Record the must's **Babo** over time.
- Record the must's **pH**.
- Record the must's **temperature** over time.
- Record **how much yeast was added, and when**.
- In the fermentation curve, see **whether the trend is normal**, depending on whether the fermentation is **spontaneous or inoculated**, e.g. tell the grower when it is a good time to add **yeast hulls**.
- See a **summary of this season's rain and diseases** (assume all parcels go into the same must) to infer **fermentation risks**.
- First look for documentation in **English, Italian and French**, then write a **rollout plan**.

Added after the issue (product owner, 25 Oct 2026):

- The feature's purpose is to **help the grower as much as possible to ferment spontaneously, or at least biodynamically**.
- Only when a fermentation becomes **too problematic** does the app move on to advice that is **not biodynamic**.

## Status

As of 25 Oct 2026. Design only; nothing started.

| Phase | PR | State |
| --- | --- | --- |
| PR 1 — models, actions, fermentation list and readings form | — | Not started |
| PR 2 — fermentation curve and additions on the chart | — | Not started |
| PR 3 — curve checks and the biodynamic advice level (temperature, aeration, pied de cuve, organic yeast hulls) | — | Not started |
| PR 3b — escalation beyond biodynamic, with explicit opt-in | — | Not started |
| PR 3c — SO₂ budget and timing, argon | — | Not started |
| PR 4 — season summary and fermentation risks | — | Not started |
| PR 5 — Excel export sheet | — | Not started |
| PR 6 — ET₀ in weather history, per-parcel water balance and water-stress risk line | — | Not started |

## Current state

The app stops at the vineyard. Nothing about the cellar exists, but most of what the season summary needs is already stored.

| Area | Where | What it does today | Gap for #99 |
| --- | --- | --- | --- |
| Data model | `prisma/schema.prisma` | Parcels, treatments, products, diseases, stages, weather | No lot, reading or addition |
| Rain | `WeatherHistory.cumulativePrecipitation`, daily per `WeatherHistoryTask`, from 1 March (`lib/weather-history.ts`) | Feeds the phenology estimate and coverage | Never summed over the season |
| Diseases | `Treatment.diseaseIds`, `Disease` (Oidium, Peronospora) | Each treatment says which disease it targets | No "diseases this season" view. Botrytis and sour rot, the diseases that matter most for fermentation, are not in the catalogue yet (D14 adds them) |
| Copper / sulfur | `ProductApplication` → `SubstanceDose` | Totals per year, coverage after rain | No "days between last sulfur and harvest" |
| Harvest | — | Not recorded. `RIPE` stage is the closest signal | Needed for pre-harvest windows |
| Navigation | `navigation` in `lib/app-shell.ts` | Home, Parcels, Treatments, Profile | No cellar entry |

## Research

Findings from English, Italian and French sources. Numbers are given with their source; the app uses them as guidance, never as rules.

### Measuring sugar: Babo, density and the end of fermentation

- 1 °Babo ≈ 10 g of grape sugar per kg of must; Babo hydrometers are calibrated at 15 °C or 17.5 °C and the reading must be corrected at other temperatures. Potential alcohol ≈ Babo × 0.65 (around 15 °Babo), × 0.68 (around 20), × 0.70 (around 24) (Pisciotta 2018, Rivista di Agraria).
- **White vs red: the sugar → alcohol factor differs.** The EU factor is 16.83 g of sugar per litre for 1 % vol of alcohol, and yeast strains range from 16.5 to 17.2 g/L. Warmer fermentation, mixing juice with skins and open vats lose more alcohol to evaporation (Theron 2020, Wineland). Cellar practice in France uses about 17 g/L for whites and rosés and 18 g/L for reds (winemakers' forum, not a technical reference); some put reds fermented warm with pump-overs at 19–20 g/L (forum). **Implication:** the potential alcohol shown from the first Babo reading uses 17 g/L for white and rosé lots and 18 g/L for red lots (g/L of sugar ≈ Babo × 10 × must density), shown as an estimate.
- Refractometers are only valid on must: once alcohol is above about 1 % they read too high. Hydrometers are the tool to follow the fermentation (same source).
- Exact conversion: °Oe = °KMW × (4.54 + 0.022 × °KMW) (German Wikipedia, Klosterneuburger Mostwaage). Density = 1 + °Oe / 1000.
- At the end, alcohol makes the liquid lighter than water: the BNIC follow-up sheet runs from density 1.095 down to 0.990. On a Babo hydrometer this means readings at or below 0.
- **Implication:** growers read Babo only (product owner), so the app stores Babo and accepts negative values for the last days. Thresholds found in density are converted with the °Oe formula: density 1.010 ≈ 2.2 °Babo, 1.000 = 0 °Babo, 0.995 ≈ −1.1 °Babo (below 0 the formula is an extrapolation; tune on real readings).

### How to follow a fermentation

- Measure density (Babo) at least once a day, ideally twice, until a plateau (at least two identical readings in a row); then confirm the end with a sugar analysis (< 2 g/L). Write down every input added (BNIC 2024, *Suivi de la fermentation alcoolique*).
- **Implication:** the reading form takes value + temperature together; the curve shows both; "plateau" = two identical readings.

### Temperature and pH

- Reds: yeasts struggle above 32 °C. Whites: activity drops below 15 °C (AWRI 2013).
- Typical ranges: whites 12–18 °C, reds 20–28 °C (Vinetur 2023). French extension advice: no more than 24–25 °C at the peak to keep aromas (Réussir Vigne).
- Some yeasts cannot ferment at pH 3.0 or below, especially with sulfites (AWRI 2013). A pH above 3.2–3.3 is preferable (Vinetur 2023).
- **Implication:** the lot stores its colour (white, rosé, red) to pick the range; pH is optional and checked against 3.0.

### Spontaneous vs inoculated

- In spontaneous fermentations non-*Saccharomyces* yeasts lead the first ~5 days before *S. cerevisiae* takes over; indigenous strains vary a lot, can slow down and give off-flavours (Capece et al., AIVV; PMC7709452).
- Selected yeast gives better kinetics and less volatile acidity than spontaneous fermentation; spontaneous fermentations risk an early stop with residual sugar (agrireseau / OIV documents).
- Inoculated dry yeast is rehydrated in water at 35–38 °C for 20–30 min, then acclimatised with must; inoculating late lets the indigenous flora settle first (same Italian sources).
- **Implication:** the lot stores the mode (spontaneous by default); a spontaneous lot gets a longer "not started yet" window before any warning. No source gives a number for that window — it is a proposal to validate (see open questions).

### Nutrients, yeast hulls and when to add them

- YAN target: 120–220 mg/L for a 21 °Brix must, higher for richer musts; add nutrients early and at **1/3 of the fermentation**. Once a problem is visible it is often too late, because ethanol blocks nitrogen uptake (Osborne 2018, Oregon State University). French figure: 150 mg/L for a 12–12.5 % potential must (BNIC / Sicavac).
- The second nutrient addition is made around 1/3 sugar depletion, end of the growth phase (Lallemand, Fermaid K).
- Yeast hulls soak up medium-chain fatty acids (octanoic, decanoic) that build up and block yeast membranes; they are added from mid-fermentation or at 1/3 to prevent irregular kinetics, at 20–40 g/hL, EU maximum 40 g/hL (Lallemand / AEB / Enartis data sheets). They are also a restart step for stuck fermentations (AWRI 2013; Osborne 2018).
- **Spontaneous fermentation specifically:** one study looked at yeast hulls in spontaneous fermentation. Over three vintages, on free-run Viura white juice at the C.I.D.A. experimental winery (La Rioja), adding yeast hulls improved the kinetics: more viable yeasts at the end of the growth phase and less residual sugar at the end. The authors also describe a new effect: the hulls **select which wild yeast strain** carries the spontaneous fermentation (López, Santamaría, Epifanio, Garijo, Gutiérrez 2000, *OENO One*). Caveats: only the abstract could be read (full text unreachable), so dose and timing are unknown; it is one study on one white variety; nothing found for reds or for Italian/French conditions.
- **Implication — the yeast-hulls hint:** once a third of the starting sugar is gone (Babo ≤ ⅔ of the first reading), the app says "good moment for nutrients / yeast hulls" if none were recorded; earlier and more firmly when the curve slows down. **Proposal, not sourced:** showing the hint more prominently for spontaneous lots. López et al. 2000 supports a benefit in spontaneous fermentation, but no source says hulls matter *more* there than in inoculated ones.

### Pied de cuve: making spontaneous fermentation safer

- A pied de cuve is a starter made from the estate's own grapes: a small share (often 5–10 % of the volume) is picked a few days to a week before the main harvest and left to ferment spontaneously; the active must then starts the main vats (Wine with Seth wiki, search summary; Unipa FitForThem research pages).
- In a 2020 study, pieds de cuve were **as effective as active dry yeast** for fermentation kinetics and wine chemistry, even though *S. cerevisiae* was scarce at the start, and **secured the fermentation better than plain spontaneous fermentation**. Strain diversity at mid-fermentation depended on the pied de cuve (Börlin et al. 2020, *OENO One* 54(3):435–442, abstract).
- A variant adds wine at 1.5 % or 3 % ethanol to the starter to favour *S. cerevisiae* ("fortified pied de cuve", Unipa research, search summary).
- **Implication:** the most useful biodynamic advice comes *before* the fermentation: a reminder to prepare a pied de cuve a few days before the planned harvest.

### Biodynamic and organic rules: what each level allows

Read in full: the Demeter standard's wine chapter (International Demeter Biodynamic Standard for 2026, as of September 2025, §7.12; first read in the 2022 version, the rules used here are unchanged) and Ceres' summary of the EU organic rules (Reg. 2018/848, 2021/1165 Annex V Part D, v. 4 May 2022).

| Practice / input | Demeter (biodynamic) | EU organic |
| --- | --- | --- |
| Indigenous yeasts, pied de cuve | Yes: the default | Yes |
| Heating and cooling to steer fermentation; red mash heated up to 35 °C | Yes | Heat treatments up to 75 °C |
| Air, oxygen (aeration); micro-oxygenation | Yes; micro-ox only early, against reduction | Air and gaseous oxygen allowed |
| Yeast hulls | Only Demeter or organic hulls | Yes ("yeast bark") |
| Other yeast nutrients (e.g. thiamine, autolysates) | Only with approval from the certifier | Yes: thiamine hydrochloride, yeast autolysates, inactivated yeasts |
| Diammonium phosphate (DAP) | **Forbidden** | Yes |
| Brought-in yeast | Only certified-organic neutral yeast, and only for a justified stuck fermentation at 5 °Brix / 50 g/L of sugar or less | Yes (organic strains when available) |
| Fresh lees from dry wines | Not in the positive list | Up to 5 % of the volume, organic origin |

- Demeter works with a positive list: anything not listed is excluded.
- Demeter Austria is stricter and allows only spontaneous fermentation or the winery's own yeast (Austrian Wine, search summary). Rules can differ between national Demeter bodies. **Decision (product owner):** we don't know which body our users depend on, so the app follows the least strict rule, i.e. the international standard; growers under a stricter national body apply their own rules on top.
- What changed between the 2022 and 2026 versions of the wine chapter, none of which affects the fermentation advice: rectified grape must allowed for enrichment, albumin added to fining agents, tartaric acid up to 2.5 g/L by exemption for federation licensees, cross-flow filtration no longer needs an exemption, baking soda, tartaric acid and UV added for cleaning.
- 50 g/L of sugar is roughly 5 °Babo (1 °Babo ≈ 10 g/kg). Near the end, alcohol skews hydrometer readings, so the Demeter threshold should be checked with a sugar test, not the Babo reading.
- **Implication:** the advice engine has four levels, and each advice is tagged with the level it belongs to (see "Spontaneous first: the advice ladder").

### Sulfur dioxide: when, how much, and the biodynamic limits

**When (OIV-OENO 631-2020, guidelines to reduce SO₂ in winemaking, read in full):**

- SO₂ is advised at least: at harvest when grapes are machine-picked (whites, rosés); before fermentation (grapes and must), especially for whites and rosés; **at the end of alcoholic fermentation, or of malolactic fermentation if there is one**; at bottling.
- Before fermentation, keep the addition **as small as possible and adapted to the must's pH**: SO₂ added then binds to acetaldehyde made later by the yeasts, which raises total SO₂ for nothing.
- **No SO₂ during alcoholic fermentation.** A fast fermentation does not need it, the added SO₂ binds uselessly, and yeasts can turn it into H₂S.
- Exception: before **restarting a stuck or sluggish fermentation**, a proper SO₂ addition is recommended to stop bacteria, together with yeast hulls.
- Grapes with botrytis need more SO₂: botrytis laccase resists it better than the grape's own enzymes. Musts from damaged grapes should be handled apart.
- A few days after an addition, measure free SO₂ again: binding is not instantaneous. Top up if needed.
- Yeasts make SO₂ themselves, up to 100 mg/L depending on strain and must (OIV); from a few mg to more than 50 mg/L (Sollazzo 2014, Rivista di Agraria).

**How much:**

- OIV reference values: **20–40 mg/L free SO₂** against oxidation; against microbes in the finished wine, **0.6 mg/L molecular SO₂** for dry wines and **≥ 0.8 mg/L** for sweet wines.
- pH changes everything. For ~0.8 mg/L molecular SO₂ you need about 14 mg/L free at pH 3.0, 44 at pH 3.5 and 87 at pH 3.8 (Winemaker Magazine, search summary; consistent with the formula above). A high-pH wine from a dry vintage (see water stress) needs much more SO₂ for the same protection.
- Practical doses from three French consultant oenologists (Réussir Vigne, Apr 2025): at harvest 4 g/hL for healthy grapes, 5–6 g/hL for damaged ones; one of them uses 2–3 g/hL and aims for at most 60 mg/L total at bottling. End of fermentation: 4–6 g/hL to reach 15–20 mg/L free. **Do not split doses**: splitting raises bound SO₂. Check monthly.
- After malolactic fermentation, wait a few days before adding SO₂: the bacteria keep consuming acetaldehyde for several days, and SO₂ added earlier would bind to it (Réussir Vigne 2016, quoting L. Vial). The same article quotes the IFV: 50–100 mg/L total is a realistic goal, but wines with no SO₂ at all remain too unpredictable to recommend.
- Unit help: 1 g/hL = 10 mg/L. Potassium metabisulfite (K₂S₂O₅) carries at most 57.6 % of its weight as SO₂ (2 × 64.07 / 222.3), so 10 g/hL of metabisulfite brings ≤ 57.6 mg/L SO₂.

**Limits on total SO₂ (mg/L):**

| Wine | Demeter (at bottling) | EU organic | EU conventional (Sollazzo 2014) |
| --- | --- | --- | --- |
| Red, dry | 100 (residual sugar < 5 g/L) | 100 (residual sugar < 2 g/L) | 150 |
| White / rosé / sparkling, dry | 140 (< 5 g/L) | 150 (< 2 g/L) | 200 |
| Red, ≥ 5 g/L sugar | 140 | conventional limit − 30 | — |
| White / rosé / sparkling, ≥ 5 g/L sugar | 180 | conventional limit − 30 | — |
| Sweet with botrytis | 360 | — | — |
| Sweet without botrytis | 250 | — | — |

- Demeter: "Sulphur dioxide is to be used to the minimum". Allowed forms: pure SO₂ (gas or solution), potassium bisulfite, potassium metabisulfite; effervescent tablets are forbidden (Demeter standard §7.12).
- EU organic: in years of severe fungal pressure the authority can temporarily raise the organic limit (Ceres 2022).
- Above 10 mg/L total, "contains sulphites" must be on the label (OIV; Sollazzo 2014).
- **Implication:** the app keeps an SO₂ budget per lot: total SO₂ **measured** if the grower has an analysis, otherwise the **sum of additions**, which is only a lower bound because yeasts also make SO₂. It compares the budget with the limit for the lot's standard, colour and residual sugar. The advice is "first measure free and total SO₂", then a single dose sized from the free SO₂ target and the pH.

### Argon

- **Before fermentation, instead of SO₂:** OIV 631-2020 recommends inert gas in the phases most exposed to oxygen before fermentation (transfer after destemming or crushing, pressing, settling), and when running off whites and rosés. Gas suppliers market nitrogen or argon to protect crushed grapes and must and cut SO₂ (Air Products, Messer; commercial, search summaries). The OIV still pairs inert gas *with* SO₂ for whites, so no source says argon fully replaces SO₂; the app treats argon as the default pre-fermentation protection and SO₂ before fermentation as an optional extra (see the ladder).

- An inert gas heavier than air (1.78 g/L, vs 1.29 for air and 1.25 for nitrogen) that, unlike CO₂ (1.98 g/L), barely dissolves in wine. So it is the gas of choice for blanketing a headspace near bottling; nitrogen is too light to form a layer (Crowe, Winemaker Magazine). Pour it slowly, parallel to the surface. Some mixing with air always happens: a full vessel protects better than any gas.
- OIV 631-2020 recommends inert gas (argon, nitrogen, CO₂ or mixes) when running off whites and rosés, for receiving tanks and pipes, for headspaces that cannot be avoided, and during filtration and bottling. It is one of the main levers to **use less SO₂**.
- **Demeter:** argon is in the general list of approved processing aids "as inert gas/processing aid for all product groups" (Demeter standard §3.3, table 1). But the wine chapter names only CO₂ and N₂ as **bottling** aids (§7.12.4). Decision (product owner): the app allows argon at every step, bottling included, on the strength of the general list.
- **EU organic:** allowed, but not for sparging (bubbling gas through the wine) (Ceres 2022).
- **Implication:** argon is a level-1 (biodynamic) advice: "inert the receiving tank / headspace", especially for whites and rosés and for lots kept with little SO₂.

### Water stress → fermentation risks

**Effect on the must.** Five vintages (2021–2025) of must analyses from 140+ parcels in the canton of Vaud (Chasselas, Pinot noir, Gamay) (Aleid-Germanier, Verdenal, Zufferey, Viret 2026, *Agrarforschung Schweiz*):

- Hot, dry vintages (2022, 2023) give more sugar, less acidity and much less yeast-assimilable nitrogen (YAN). Malic acid in particular drops under water stress and heat.
- 2022, the driest year (674 mm of rain from January to October vs a 937 mm normal at Pully, −264 mm), had the lowest average YAN: 119 mg N/L, vs 154 in the wet 2024 (1107 mm). Average sugar was 90 °Oe in 2022 vs 82 in 2024.
- Regions with deep-rooting soils (Chablais, Lavaux) keep more YAN; shallow or compact soils suffer more "hydro-nitrogen" stress.
- Chasselas is often below the 140 mg N/L threshold, and loses ~15–20 % of its YAN between veraison and harvest.
- Low YAN means slow or incomplete fermentations, residual sugar, weaker aromas and bitterness. Adding nitrogen in the cellar only partly makes up for it.
- Moderate water stress during ripening is desirable; earlier stress harms the vine.

No Italian source with plant water-stress thresholds was found (searched again on 25 Oct 2026); French and English sources are enough (product owner).

Same picture from other sources: dry, hot vintages give more sugar, less acidity and less YAN, and moderate stress during ripening cuts malic acid and YAN (OENO One 2020 / IVES summaries, search only). Italian ripening thresholds for YAN (APA): 150 mg/L for a safe fermentation, 250 mg/L for quality (Agroscope Italian note / Lallemand data sheets, search only).

**How much water is "water stress"?** There is no fixed amount of rain. Stress depends on what the soil can store, what the vine and the air take out, and when it happens. It is measured on the plant or estimated from a soil water balance:

| Measure | No stress | Weak | Weak → moderate | Moderate → severe | Severe | Source |
| --- | --- | --- | --- | --- | --- | --- |
| Predawn leaf water potential (pressure chamber) | > −0.2 MPa | −0.2 to −0.3 | −0.3 to −0.5 | −0.5 to −0.8 | < −0.8 MPa | IFV Occitanie |
| Fraction of soil water still available to the vine (FTSW, water balance model) | > 36 % | 21–36 % | 7–21 % | 1–7 % | < 1 % | IFV Occitanie |

- **Soil reserve (réserve utile):** 50–300 mm depending on soil and rooting depth. Below 100 mm the parcel is very sensitive to drought, 100–200 mm moderately, above 200 mm little (Réussir Vigne 2017).
- **Consumption:** about 1.5 mm/day during active growth, ~180 mm over three months (Réussir Vigne 2017).
- **Water balance:** soil water change = rain + irrigation − vine transpiration − soil evaporation − runoff − drainage. The simple version is rain − ET₀ × Kc (Italian agronomy course material, search only). The Riou dryness index used by the OIV applies it from April to September with a 200 mm starting reserve (Riou 1994; Tonietto & Carbonneau 2004; R `ClimClass::RDI` documentation).
- **Timing:** avoid stress before fruit set; controlled stress between fruit set and veraison limits shoot growth and berry size; reds tolerate stress well after veraison (Réussir Vigne 2017; search summaries).
- **Implication — what the app can estimate:** Open-Meteo gives daily `et0_fao_evapotranspiration` and `precipitation_sum`, and `past_days` / `start_date` work for them. Stored next to rain in `WeatherHistory`, they give a per-parcel balance from 1 March: FTSW = (reserve + Σ rain − Σ ET₀ × Kc) / reserve, clamped to 0–100 %, then classified with the IFV FTSW classes. Two unknowns per parcel: the reserve, an editable number on each parcel (default 150 mm; decided with the product owner), and Kc (vine canopy, varies by stage; a source still needs to be found). The season summary then says, for example, "Dry season: estimated water stress from July → expect low YAN, measure it or plan nutrients".

### Season → fermentation risks

| Season signal | Risk in the cellar | Source |
| --- | --- | --- |
| Rainy last weeks before harvest | Botrytis and sour rot | Rainy vintages bring downy mildew, then botrytis, aggressive near harvest (MeteoWeb 2014; L'Adige) |
| Botrytis on the grapes | Thiamine (B1) eaten before harvest → sluggish or stuck fermentation, volatile acidity, SO₂-binding compounds; laccase browning; glucans block clarification | Duncan & Divol 2022 (Wineland); Virginia Tech Vintner's Corner |
| Oidium (powdery mildew) during the season | Damaged berries are more open to botrytis | Arezzo / regional bulletins |
| Sulfur sprayed less than ~30 days before harvest | Elemental sulfur turns into H₂S during fermentation | AWRI (30-day withholding period); research summary: below 10 µg/g when the last spray was more than 35 days before harvest |
| Late copper sprays | Copper stresses or kills yeast → incomplete fermentation, off-aromas | Michigan State University; AWRI |
| Agrochemical residues in general | Fermentation inhibitors | AWRI 2013 |

- **Implication:** the summary uses what the grower records: treatments per disease, including treatments against botrytis and sour rot once they are in the catalogue (D14), the grapes' health at harvest (Q11), and the last sulfur and copper dates. Rain is shown as context but **never turned into a botrytis risk**: the grower tells the app about botrytis, the app does not deduce it (product owner). All parcels count, as the issue says.

## Proposed design

### Goals and non-goals

- **Goal:** record readings (Babo, temperature, pH) and additions (yeast, nutrients, yeast hulls) per lot, from the phone, in the cellar.
- **Goal:** one curve per lot with readings and additions on the same time axis.
- **Goal:** spontaneous fermentation is the default path. Every advice starts at the biodynamic level (temperature, aeration, pied de cuve, Demeter/organic yeast hulls) and only escalates when the curve is clearly in trouble.
- **Goal:** simple checks that say "normal / slowing / stopped / too hot / too cold / low pH", tuned by mode and colour, plus the yeast-hulls hint.
- **Goal:** each advice says which level it belongs to, and whether following it keeps or loses Demeter or organic certification.
- **Goal:** a season summary with the risks it implies for this vintage.
- **Non-goal:** certifying anything. The app quotes the standards; the grower's certifier has the last word (some advice explicitly needs their approval).
- **Goal:** follow SO₂ additions and analyses against the lot's limit (Demeter, organic, conventional), and say when to add SO₂ and when not to.
- **Non-goal:** oenological tannins, including gall tannin: not in the Demeter positive list for wine (tannic acid is listed only for sweeteners and spirits), so the app never suggests them.
- **Non-goal:** following malolactic fermentation, ageing and bottling step by step (SO₂ advice only marks the end of fermentation / malolactic as the moment to sulphite).
- **Non-goal:** connected sensors and density readings (density probes exist, e.g. those in Réussir Vigne; manual entry first).
- **Non-goal:** must clarification and turbidity (débourbage, NTU). Too-clear musts can ferment slowly, but the targets found were not solid enough (product owner: out of scope for now).
- **Non-goal:** requiring lab analyses. pH, acidity, YAN and sugar are optional fields (Q20); the checks work without them.
- **Non-goal:** choosing which parcels go into which vat (v1 counts all parcels, as the issue says; see D4).

### Questions asked when creating a fermentation

The grower creates a lot in the cellar, on the phone, often with wet hands. So the form asks **only what the first checks need**, with defaults, and the rest is optional: shown as "Add details" on creation and as prompts on the lot page when an advice would use it. Every question below says what it feeds; a question that feeds nothing is not asked.

**Required (step 1 — one screen):**

| # | Question | Answers | Used for | Field |
| --- | --- | --- | --- | --- |
| Q1 | Name of the vat | Text ("Vasca 1") | List, export | `name` |
| Q2 | White, rosé or red? | White · Rosé · Red | Potential alcohol factor (17 vs 18 g/L per % vol), temperature ranges (whites 12–18 °C, reds 20–28 °C, alert > 32 °C), SO₂ limit (Demeter 140 vs 100 mg/L dry), which follow-up questions appear | `color` |
| Q3 | How will it ferment? | Spontaneous (default) · Pied de cuve · Selected yeast | "Not started" window, advice ladder, Demeter status | `mode` |
| Q4 | Which rules do you follow? | Biodynamic (default) · Organic · Conventional | Highest advice level shown, SO₂ limit, allowed inputs | `standard` |
| Q5 | When were the grapes picked? | Date (last picking day if several) | Days between last sulfur/copper spray and harvest, rain in the 30 days before harvest, pied de cuve reminder | `harvestedAt` |
| Q6 | When did the fermentation start (or the must go into the vat)? | Date, default today | Time axis of the curve, "not started" window | `startedAt` |
| Q7 | First reading | Babo and temperature | Baseline of the curve: ⅓ of the drop for the yeast-hulls hint, "not started" check, potential alcohol (17 g/L of sugar per % vol for white and rosé, 18 g/L for red) | first `FermentationReading` |

**Recommended (step 2 — "Add details", each skippable):**

| # | Question | Shown when | Answers | Used for | Field |
| --- | --- | --- | --- | --- | --- |
| Q8 | Volume in the vat | Always | Litres | Turns g/hL advice into grams to weigh (yeast hulls, SO₂) | `volumeL` |
| Q9 | Grape varieties | Always | List | Low-YAN varieties (e.g. Chasselas often < 140 mg N/L, Agrarforschung Schweiz 2026) raise the nutrient advice | `varieties` |
| Q10 | Hand or machine harvest? | Always | Hand · Machine | OIV advises SO₂ at machine harvest for whites/rosés; Demeter prefers hand harvest | `harvestMethod` |
| Q11 | How healthy were the grapes? Were they sorted? | Always | Healthy · Some rot · Much rot (botrytis / sour rot); sorted yes/no | SO₂ dose (4 g/hL healthy vs 5–6 damaged), botrytis → thiamine (level 2) and higher SO₂ need (OIV); together with the botrytis treatments recorded in the vineyard (D14) | `grapeHealth`, `sorted` |
| Q12 | Did the must macerate on the skins? How long? | Always | No · Yes: hours (white skin contact, *macerazione pellicolare*, usually 4–24 h before pressing) or days (rosé, red, orange wine) | Phenols and tannins extracted (tannins mostly after 3–4 days, with alcohol), temperature range for skin-contact whites, pressing reminder | `skinContactHours`, `macerationDays`, `pressedAt` |
| Q13 | Destemmed or whole bunches? | Red, rosé, skin contact | Destemmed · Whole bunch · Part (%) | Whole bunch: the cap can't be punched down until later in the ferment, so cap reminders start later | `wholeClusterPct` |
| Q14 | How do you manage the cap? | Red / maceration | None · Punch down · Pump over · Both; times per day | Aeration advice (punch-downs bring air that helps yeasts make sterols), dry-cap warning (volatile acidity), heat spread | `capManagement` |
| Q15 | Did you protect the must at crush or in the press? | Always | Nothing · Argon / inert gas · SO₂: dose (g/hL of SO₂ or metabisulfite), date | Argon: curve marker. SO₂: starts the SO₂ budget | first `INERT_GAS` or `SO2` addition |
| Q16 | Pied de cuve: when was it started, what share of the volume? | Mode = pied de cuve | Date; % (often 5–10 %) | Curve marker, start window | `PIED_DE_CUVE` addition |
| Q17 | Which yeast, how much? | Mode = selected yeast | Product, g/hL; organic? | Curve marker; Demeter allows only certified-organic neutral yeast for a stuck fermentation | `YEAST` addition |
| Q18 | What is the vat made of? | Always | Stainless steel · Wood · Concrete · Amphora / clay · Fibreglass or epoxy · Plastic | Demeter: no new fibreglass/epoxy tanks since 2022, plastic only for transfers; temperature inertia and oxygen exchange | `container` |
| Q19 | Can you cool or heat the vat? | Always | No · Cool · Heat · Both | Only shows temperature advice the grower can act on (Demeter allows heating/cooling to steer the fermentation, red mash up to 35 °C) | `temperatureControl` |
| Q20 | Must analysis at the start | Always | pH, total acidity (g/L), YAN (mg N/L), sugar (g/L) | pH ≤ 3.0 warning and molecular SO₂; YAN below 140–150 mg/L → nutrient advice; sugar for potential alcohol | first reading (`ph`, `totalAcidityGL`, `yanMgL`, `sugarGL`) |
| Q21 | What wine do you aim for? | Always | Dry · Off-dry · Sweet | End-of-fermentation check (< 2 g/L for dry), SO₂ limit (dry vs ≥ 5 g/L sugar), molecular SO₂ target 0.6 vs 0.8 mg/L | `targetStyle` |
| Q22 | Will it do malolactic fermentation? | Always | Yes · No · Let it happen | When to sulphite: end of alcoholic fermentation, or a few days after malolactic | `malolactic` |

Not asked here: soil reserve and irrigation (they belong to the parcel, for the water balance in PR 6).


### Data model

```prisma
enum FermentationMode {
  SPONTANEOUS
  PIED_DE_CUVE
  INOCULATED
}

/// How far the grower accepts advice to go (see the advice ladder).
enum FermentationStandard {
  BIODYNAMIC
  ORGANIC
  CONVENTIONAL
}

enum WineColor {
  WHITE
  ROSE
  RED
}

enum HarvestMethod {
  HAND
  MACHINE
}

enum GrapeHealth {
  HEALTHY
  SOME_ROT
  MUCH_ROT
}

enum FermentationContainer {
  STAINLESS_STEEL
  WOOD
  CONCRETE
  AMPHORA
  FIBREGLASS_EPOXY
  PLASTIC
  OTHER
}

enum TemperatureControl {
  NONE
  COOLING
  HEATING
  BOTH
}

enum CapManagement {
  NONE
  PUNCH_DOWN
  PUMP_OVER
  BOTH
}

enum TargetStyle {
  DRY
  OFF_DRY
  SWEET
}

enum MalolacticPlan {
  YES
  NO
  LET_IT_HAPPEN
}

enum FermentationAdditionKind {
  YEAST
  PIED_DE_CUVE
  NUTRIENT
  YEAST_HULLS
  AERATION
  SO2
  INERT_GAS
  OTHER
}

/// One container of must followed as one alcoholic fermentation.
model Fermentation {
  id          String           @id @default(cuid())
  userId      String
  name        String           // "Vasca 1"
  vintage     Int
  mode        FermentationMode @default(SPONTANEOUS)
  standard    FermentationStandard @default(BIODYNAMIC)
  color       WineColor
  harvestedAt DateTime         // Q5: pre-harvest windows
  startedAt   DateTime         // Q6
  // Optional details (Q8–Q22)
  volumeL            Float?
  varieties          String[]
  harvestMethod      HarvestMethod?
  grapeHealth        GrapeHealth?
  sorted             Boolean?
  skinContactHours   Float?
  macerationDays     Float?
  pressedAt          DateTime?
  wholeClusterPct    Float?
  capManagement      CapManagement?
  capActionsPerDay   Int?
  container          FermentationContainer?
  temperatureControl TemperatureControl?
  targetStyle        TargetStyle?
  malolactic         MalolacticPlan?
  endedAt     DateTime?
  createdAt   DateTime         @default(now())
  updatedAt   DateTime         @updatedAt
  user        User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  readings    FermentationReading[]
  additions   FermentationAddition[]

  @@index([userId, vintage])
}

/// A reading of the must at a point in time; at least one measure is set.
model FermentationReading {
  id             String       @id @default(cuid())
  fermentationId String
  measuredAt     DateTime
  babo           Float?       // as read on the hydrometer; negative near the end of fermentation
  temperatureC   Float?
  ph             Float?
  totalAcidityGL Float?
  yanMgL         Float?
  sugarGL        Float?       // sugar test (end of fermentation, Demeter 50 g/L rule, SO₂ limit category)
  freeSo2MgL     Float?
  totalSo2MgL    Float?
  createdAt      DateTime     @default(now())
  fermentation   Fermentation @relation(fields: [fermentationId], references: [id], onDelete: Cascade)

  @@index([fermentationId, measuredAt])
}

/// Something added to the must: yeast, nutrients, yeast hulls…
model FermentationAddition {
  id             String                   @id @default(cuid())
  fermentationId String
  addedAt        DateTime
  kind           FermentationAdditionKind
  productName    String?
  doseGPerHl     Float?
  createdAt      DateTime                 @default(now())
  fermentation   Fermentation             @relation(fields: [fermentationId], references: [id], onDelete: Cascade)

  @@index([fermentationId, addedAt])
}
```

Run `npx prisma migrate dev --name add_fermentation` after editing the schema; no hand-written SQL.

### Decisions

| # | Decision | Why |
| --- | --- | --- |
| D1 | Store Babo only, negative values allowed | Growers read Babo only (product owner). Density thresholds from the sources are converted once to Babo (°Oe formula) |
| D2 | One table per kind of event (readings, additions) | Readings are numeric series for the chart; additions are point events with a product and dose |
| D3 | `mode` and `color` on the lot | They change the thresholds: start window (mode) and temperature range (colour) |
| D4 | No parcel link in v1; the season summary uses all the user's parcels | What the issue asks for. A `parcels` relation can be added when growers vinify parcels apart |
| D5 | Yeast is an addition of kind `YEAST`, not a field on the lot | The issue asks "how much and when"; a second inoculation (restart) is just another row |
| D6 | Doses in g/hL | The unit of the data sheets and of the EU 40 g/hL limit |
| D7 | `mode` defaults to `SPONTANEOUS`, `standard` to `BIODYNAMIC` | The feature exists to help spontaneous and biodynamic fermentation; the grower lowers the standard, never the app |
| D8 | Escalating beyond the lot's `standard` needs an explicit opt-in on that lot | Following a non-biodynamic advice can cost the certification for the whole vat; the grower must choose it knowingly, and the choice is recorded |
| D9 | Pied de cuve is both a mode (the vat was started with one) and an addition kind (when it was added, how much) | Same pattern as yeast in D5 |
| D10 | SO₂ additions stored like other additions (`SO2`, dose in g/hL of SO₂ equivalent; metabisulfite converted on input at 57.6 %) | One timeline for the curve and the budget; the conversion is stoichiometric |
| D11 | The SO₂ budget prefers the last measured total SO₂ over the sum of additions | Yeasts make SO₂ too (up to 100 mg/L), so additions alone underestimate it |
| D12 | Seven required questions (Q1–Q7), the rest optional and asked again only when an advice needs it | Creation happens in the cellar on a phone; every extra required field is a reason not to start. Defaults (spontaneous, biodynamic, today) cover the common case |
| D13 | Must analyses at the start live on the first reading, not on the lot | Same fields as later readings (pH, sugar, YAN, acidity), one place for the chart |
| D14 | Add Botrytis and Sour rot to the disease catalogue (seed), with Botrytis stage levels from the matrix in `design-docs/phenological-stage.md` | Growers record their treatments against botrytis like any other; the season summary reads them instead of guessing from rain |

### Curve checks (`lib/fermentation-curve.ts`)

Pure functions over the readings, unit-tested like `lib/phenology.ts`. Each returns a status and a translation key, never a number dressed as precision.

| Check | Rule (proposal) | Source |
| --- | --- | --- |
| Not started | No Babo drop since the first reading after 48 h (inoculated) or 96 h (spontaneous) | Windows to validate; spontaneous starts slower (Italian sources) |
| Slowing | Daily drop below ⅓ of the best daily drop so far while Babo > 2 (density ≈ 1.010) | Idea from AWRI "see the slowdown before the stop"; thresholds to validate |
| Stopped / stuck | Two identical readings in a row with Babo > 0 (density > 1.000) | BNIC plateau rule |
| Finished? | Two identical readings at Babo ≤ −1 (density ≈ 0.995): "confirm with a sugar test (< 2 g/L)" | BNIC |
| Temperature | White/rosé: warn below 15 °C or above 20 °C; red: warn above 30 °C, alert above 32 °C | AWRI; Vinetur; Réussir Vigne |
| pH | Warn at ≤ 3.0 | AWRI |
| Yeast-hulls hint | Babo has lost ⅓ of its starting value (drop towards 0) and no `NUTRIENT`/`YEAST_HULLS` addition yet → "Good moment for yeast hulls (20–40 g/hL, max 40) — Demeter/organic hulls for a biodynamic lot". Shown earlier when "Slowing". Other nutrients only from the "with certifier approval" level up | Osborne 2018; Lallemand; AEB/Enartis data sheets; Demeter standard |

### Spontaneous first: the advice ladder (`lib/fermentation-advice.ts`)

Every advice belongs to one level. The app shows the lowest level that fits the situation, never more than the lot's `standard` allows unless the grower opts in (D8).

| Level | When it is offered | Advice (examples) |
| --- | --- | --- |
| 1 — Biodynamic | Always; the only level while the curve is normal | Before harvest: prepare a pied de cuve a few days early. At crush and pressing: protect the must with argon. During: keep the temperature in range (heat or cool), aerate during the growth phase, Demeter/organic yeast hulls at ⅓ of the fermentation, measure twice a day, no SO₂ during fermentation. After: inert tanks and headspace with argon, one SO₂ dose at the end of fermentation (or a few days after malolactic) sized from free SO₂ and pH, within the Demeter limit |
| 2 — Biodynamic, certifier approval | "Slowing" persists for two days despite level 1, or the season summary flags a risk (botrytis, water stress) | Other yeast nutrients such as thiamine, after asking the certifier. A justified stuck fermentation at ≤ 50 g/L sugar: certified-organic neutral yeast is still within Demeter |
| 3 — Organic (loses Demeter) | "Stopped" with more than 50 g/L of sugar left, or "Not started" well past its window | Selected organic yeast, DAP, autolysates, fresh lees from a dry wine (≤ 5 %), SO₂ up to the organic limit |
| 4 — Conventional (loses organic) | Only if the lot's standard is `CONVENTIONAL` | Inputs outside the organic list |

- Levels 3 and 4 are hidden behind a "Show non-biodynamic options" action on the lot. It says what certification the vat would lose, and the choice is saved on the lot (`standard` lowered, with the date).
- Every advice links to its source and says "consider" or "ask your certifier", never "add".
- **SO₂ before fermentation** is a very optional suggestion: never a hint, never a warning. It only appears folded under the argon advice ("If you also want SO₂ at crush: keep it small and adapted to pH; 4 g/hL for healthy grapes, 5–6 g/hL for damaged ones"), because OIV and Demeter both ask for the minimum and no source covers spontaneous fermentation specifically.
- Escalation triggers are proposals: tune them on the first vintage, like the curve thresholds.

### SO₂ budget (`lib/fermentation-so2.ts`)

- **Limit** from the lot's `standard`, `color` and the last `sugarGL` (dry vs sweet), using the table in the research section.
- **Budget used**: the last `totalSo2MgL` measured; otherwise the sum of `SO2` additions in mg/L, shown as "at least".
- **Molecular SO₂** from the last `freeSo2MgL` and `ph`, compared with 0.6 (dry) or 0.8 (sweet) mg/L.
- **Hints:** "No SO₂ during fermentation" when a reading shows the fermentation is active; "Good moment to sulphite" once the fermentation is finished (and a few days after malolactic is marked); "Measure free SO₂ again" a few days after an addition; "Above 80 % of the Demeter limit" before any further addition; "Restarting a stuck fermentation: a small SO₂ addition first, with yeast hulls" (OIV).
- The dose helper turns a free SO₂ target into g/hL (SO₂ or metabisulfite), but never proposes a dose that would push the budget over the lot's limit.

### Season summary (`lib/fermentation-season.ts`)

For the lot's vintage, across all the user's parcels:

- Rain since 1 March and in the 30 days before `harvestedAt` (sum of `cumulativePrecipitation` over the parcels' weather tasks; average across tasks).
- Number of treatments per disease (`Treatment.diseaseIds`) this year.
- Days between the last sulfur application and harvest; days between the last copper application and harvest.
- Derived risk lines, each tagged with its advice level: "Botrytis this season → plan a pied de cuve and yeast hulls (level 1); thiamine with certifier approval (level 2)" (botrytis or sour-rot treatments recorded this year, or Q11 = some/much rot), "Sulfur within 30 days of harvest → H₂S risk", "Late copper → yeast stress", "Dry season / water stress → low YAN likely: yeast hulls (level 1), other nutrients with approval (level 2)" (water balance from "Water stress → fermentation risks", PR 6).

Reads go through `lib/data-fetcher.ts`. If #74 lands first, "the user's parcels" follows its membership rule instead of `Parcel.userId`.

### UX

- New entry **Cellar** (`/fermentations`). Where it lives (fifth bottom-nav icon at 375 px, or under Treatments) is handed off to Claude Design.
- List page: one card per lot (name, mode, colour, last reading, status chip). "New fermentation" dialog in two steps: Q1–Q7 on one screen, then "Add details" (Q8–Q22, only those that apply to the colour and mode), skippable. On the lot page, a missing detail is asked inline when an advice needs it (e.g. "How healthy were the grapes?" next to the SO₂ dose helper).
- Lot page:
  - Header with status chip and the current hint.
  - Curve: Babo on the left axis, temperature on the right, additions as markers. Recharts via `components/ui/chart.tsx`.
  - "Add reading" dialog: date/time (defaults to now), Babo (negative allowed), temperature, optional pH. Big numeric inputs for wet hands.
  - "Add addition" dialog: kind, product, dose (g/hL).
  - Season summary card, with the "experimental" label used for coverage.
- All new strings in `locales/en.json` and `locales/it.json`.

### Testing

- Unit: every curve check on synthetic Babo series (normal inoculated, slow spontaneous start, plateau at 5 °Babo, finished at −1.5 °Babo, red at 33 °C), season sums with missing weather days.
- Integration: server actions reject readings on another user's lot; creating a lot with only Q1–Q7 works, and the conditional questions (e.g. Q14 for whites) are rejected or ignored.
- Unit: SO₂ budget (measured vs summed), molecular SO₂ from free SO₂ and pH, limit by standard/colour/sugar, the dose helper never exceeding the limit.
- Unit: the advice ladder never returns a level above the lot's `standard` unless opted in; a stuck lot at 40 g/L stays at level 2, at 80 g/L reaches level 3.
- E2e: create a lot (spontaneous and biodynamic by default), add three readings and a yeast-hulls addition, see the curve and a level-1 hint; opt in to non-biodynamic options and see the warning.

## Rollout plan

| Phase | Scope | Ships to users? |
| --- | --- | --- |
| PR 1 | Models + migration, Zod schemas, actions (create lot, add/delete reading, add/delete addition), list page and lot page with a table of readings; nav entry | Yes — usable as a digital fermentation sheet |
| PR 2 | Curve (Babo + temperature, additions as markers) | Yes |
| PR 3 | `lib/fermentation-curve.ts` checks, status chip, level-1 (biodynamic) advice incl. pied de cuve reminder and yeast-hulls hint, behind the "experimental" label | Yes |
| PR 3b | Levels 2–4 of the advice ladder, the opt-in action and the certification warning | Yes |
| PR 3c | SO₂ readings and additions, budget against the limit, molecular SO₂, SO₂ timing hints and dose helper; argon addition kind | Yes |
| PR 4 | Botrytis and Sour rot in the disease catalogue (seed + stage levels, D14); season summary card and risk lines | Yes |
| PR 5 | "Fermentation" sheet in the Excel export | Yes |
| PR 6 | Fetch daily `et0_fao_evapotranspiration` into `WeatherHistory`; editable soil reserve on each parcel (default 150 mm); FTSW estimate and the water-stress line in the season summary | Yes |
| Later | Parcel ↔ lot link, malolactic follow-up, connected probes, must turbidity | — |

Each PR stays small enough to test during one harvest: PR 1–2 before the next vintage starts, PR 3–4 tuned on real curves from that vintage.

## Open questions and risks

- [ ] Pied de cuve reminder: tie it to the `RIPE` stage or to a planned harvest date entered by the grower?
- [x] Escalation triggers between levels (2 days of "Slowing", "Not started" past its window): agreed as proposals, tuned on real curves after the first vintage.
- [x] Start windows (48 h / 96 h) and the "slowing" ratio: kept as proposals for now, tuned on real curves from the first vintage before turning warnings red.
- [ ] Water balance: Kc of the vine by stage (FAO-56 or an IFV table?). The soil reserve is settled: one editable number per parcel, default 150 mm.
- [ ] Navigation: a fifth bottom-nav icon, or Cellar under Treatments? Hand off to Claude Design along with the list, lot and creation screens.

- **Risk — false precision:** fermentation advice is guidance; wording says "consider", products are never prescribed, and doses always quote the legal limit.
- **Risk — data gaps:** growers read once a day or skip days; checks must work on uneven intervals (per-day rates, not per-reading).
- **Risk — temperature correction:** a hydrometer read away from its calibration temperature is off; v1 trusts the typed value and says so in a hint.

## Sources

Pages opened for this doc (as of 25 Oct 2026):

1. [cpelican/agricolala#99 — We would like to be able to conduct the fermentation from agricolala](https://github.com/cpelican/agricolala/issues/99)
2. [Pisciotta (2018) — La determinazione del contenuto zuccherino delle uve e dei mosti, Rivista di Agraria](https://www.rivistadiagraria.org/articoli/anno-2018/la-determinazione-del-contenuto-zuccherino-delle-uve-dei-mosti/)
3. [Wikipedia (de) — Klosterneuburger Mostwaage](https://de.wikipedia.org/wiki/Klosterneuburger_Mostwaage)
4. [BNIC (2024) — Suivi de la fermentation alcoolique (fiche)](https://ugvc.fr/wp-content/uploads/2025/09/20240919_suivi_fermentation_alcoolique.pdf)
5. [AWRI (2013) — Timely reminder about slow, sluggish and stuck fermentations](https://www.awri.com.au/?p=8380)
6. [Osborne (2018, reviewed 2024) — Yeast nutrients and "stuck fermentations", Oregon State University Extension EM 9619](https://extension.oregonstate.edu/catalog/em-9619-yeast-nutrients-stuck-fermentations)
7. [AWRI — What are the impacts of elemental sulfur residues on fermentation?](https://www.awri.com.au/?p=976)
8. [Duncan & Divol (2022) — The role of thiamine in sluggish fermentations, Wineland](https://www.wineland.co.za/role-of-thiamine-in-sluggish-fermentations/)
9. [Aleid-Germanier, Verdenal, Zufferey, Viret (2026) — Maturité et teneur en azote des moûts de Chasselas, Pinot noir et Gamay, *Agrarforschung Schweiz* 17:140–149, doi:10.34776/afs17-140](https://www.agrarforschungschweiz.ch/wp-content/uploads/2026/05/140-149_Verdenal_Production_vegetale_FR.pdf) ([English summary](https://www.agrarforschungschweiz.ch/en/2026/05/nitrogen-nutrition-begins-in-the-vineyard/))
10. [IFV Occitanie — Mesure du potentiel hydrique foliaire de base](https://www.vignevin-occitanie.com/fiches-pratiques/mesure-du-potentiel-hydrique-foliaire-de-base/)
11. [IFV Occitanie — Estimation de l'état hydrique de la vigne](https://www.vignevin-occitanie.com/fiches-pratiques/estimation-de-letat-hydrique-de-la-vigne/)
12. [Réussir Vigne (2017) — La réserve utile pour anticiper le stress hydrique](https://www.reussir.fr/vigne/la-reserve-utile-pour-anticiper-le-stress-hydrique)
13. [Open-Meteo — Forecast API documentation (daily `et0_fao_evapotranspiration`, `precipitation_sum`)](https://open-meteo.com/en/docs)
14. [R ClimClass — RDI: Riou's drought index](https://search.r-project.org/CRAN/refmans/ClimClass/html/RDI.html)
15. [Deloire, Carbonneau, Wang, Ojeda (2004) — Vine and water: a short review, *OENO One* 38(1):1–13 (AGRIS record; abstract only)](https://agris.fao.org/search/en/records/65dee3a50f3e94b9e5d25f6b)

16. [Biodynamic Federation – Demeter International — International Demeter Biodynamic Standard for 2026 (as of Sept 2025), §3.3 table 1 and §7.12 Wine and sparkling wine](https://demeter.net/wp-content/uploads/2025/11/2026_Int_Dem_bio_Standard_eng.pdf); earlier read: [standard for 2022](https://demeter.net/wp-content/uploads/2022/01/20211013_BFDI_Standard_for2022_englVersion_final.pdf)
17. [Ceres (4 May 2022) — Brief information: production of organic wine, Reg. (EU) 2018/848](https://www.ceres-cert.de/docs/transfer/3-2-737_EN.pdf)
18. [OIV-OENO 631-2020 — Review of practices for the reduction of SO₂ doses used in winemaking](https://www.oiv.int/public/medias/7593/oiv-oeno-631-2020-en.pdf)
19. [Sollazzo (2014) — I solfiti in enologia, Rivista di Agraria](https://www.rivistadiagraria.org/articoli/anno-2015/i-solfiti-in-enologia/)
20. [Réussir Vigne (15 Apr 2025) — Sulfitage : vaut-il mieux apporter de petites doses de SO₂ régulièrement ou des doses plus importantes ?](https://www.reussir.fr/vigne/sulfitage-vaut-il-mieux-apporter-de-petites-doses-de-so2-regulierement-ou-des-doses-plus)
21. [Réussir Vigne (31 Mar 2016) — Comment réduire les doses de SO₂](https://www.reussir.fr/vigne/comment-reduire-les-doses-de-so2)
22. [Crowe — Protecting your wine from oxygen during racking, Winemaker Magazine](https://winemakermag.com/wine-wizard/protecting-your-wine-from-oxygen-during-racking)
23. [Theron (1 Apr 2020) — The conversion of sugar to alcohol, Wineland](https://wineland.co.za/the-conversion-of-sugar-to-alcohol)

Abstract only (full text unreachable):

- [Börlin et al. (2020) — The "pied de cuve" as an… (full title not seen), *OENO One* 54(3):435–442, doi:10.20870/oeno-one.2020.54.3.3105](https://esploro.umontpellier.fr/esploro/outputs/journalArticle/The-pied-de-cuve-as-an/9941583409311)

- [López, Santamaría, Epifanio, Garijo, Gutiérrez (2000) — Yeast hulls: effect on spontaneous fermentation in different vinification conditions, *OENO One*](https://oeno-one.eu/article/view/1002) ([AGRIS record](https://agris.fao.org/search/ar/records/65e01d7663b8185d9cb16355))

Found through search, summary only (not opened in full):

- [Michigan State University — Late-season fungicide sprays in grapes and potential effects on fermentation](https://www.canr.msu.edu/news/late_season_fungicide_sprays_in_grapes_and_potential_effects_on_fermentatio)
- [Virginia Tech — Vintner's Corner (Botrytis, laccase)](https://enology.fst.vt.edu/VC/NOVDEC96.html)
- [Réussir Vigne — Des densimètres connectés pour maîtriser la fermentation alcoolique](https://www.reussir.fr/vigne/des-densimetres-connectes-pour-maitriser-la-fermentation-alcoolique-avec-precision)
- [Wine Making Talk — How many grams of sugar equal 1 % alcohol?](https://www.winemakingtalk.com/threads/how-many-grams-of-sugar-equal-1-alcohol.33077/latest) (forum)
- [La Passion du Vin — Titre volumique](https://www.lapassionduvin.com/de-la-terre-au-verre/5858-titre-volumique) (forum)
- [Vinetur (2023) — Tipos de fermentación: cómo es el proceso en el vino](https://www.vinetur.com/2023040572846/tipos-de-fermentacion-como-es-el-proceso-en-el-vino.html)
- [Mettler Toledo — Density of wine during fermentation](https://www.mt.com/ch/it/home/library/applications/lab-analytical-instruments/density-of-wine-during-fermentation.html)
- [Isolation and identification of indigenous wine yeasts and their use in alcoholic fermentation (PMC7709452)](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC7709452/)
- [Capece et al. — AIVV proceedings on indigenous yeasts](https://www.aivv.it/download/atti/p064_1601_0050_capece.pdf)
- [Agri-Réseau — fermentation spontanée (Document 99994)](https://www.agrireseau.net/documents/Document_99994.pdf)
- [Sicavac (2018) — Nutrition azotée des levures](https://www.vins-centre-loire.com/files/Nutrition_azotee_des_levures_Sicavac-2018.pdf)
- [UGVC / BNIC (2024) — Fiche technique pratique levurage](https://ugvc.fr/wp-content/uploads/2025/09/20240910_fiche_technique_pratique_levurage_vf.pdf)
- [Lallemand — Fermaid K](https://www.lallemandwine.com/en/north-america/products/catalogue/nutrients-protectors/2/fermaid-k/)
- [Enartis — Best practices for managing yeast nutrition](https://www.enartis.com/wp-content/uploads/2020/06/Best-Practices-for-Managing-Yeast-Nutrition.pdf)
- [AEB — yeast cell walls technical data sheet](https://aeb-group.com/getTds/2739)
- [MeteoWeb (2014) — Vendemmia 2014, rischio botrite](https://www.meteoweb.eu/2014/08/domani-inizia-vendemmia-2014-ce-rischio-botrite-causa-clima-pazzo-questestate/310494/)
- [L'Adige — Troppe piogge per l'uva](https://www.ladige.it/montagna/troppe-piogge-per-luva-produzione-in-calo-del-25-oyhvrjo1)
- [Comune di Arezzo (2026) — Bollettino vite integrato e biologico](https://comune.arezzo.it/sites/default/files/2026-07/bollettino%20arezzo%20vite%20integrato%20e%20biologico%200702.pdf)

- [Air Products — Gases in oenology](https://www.airproducts.com.hk/-/media/files/en/332/332-14-030-en-gases-in-oenology.pdf) (commercial)
- [Messer — Gas, the good spirit of wine](https://newsroom.messergroup.com/gas--the-good-spirit-of-wine/) (commercial)
- [Winemaker Magazine — Calculate molecular SO₂](https://winemakermag.com/wine-wizard/calculate-molecular-so2)
- [Réussir Vigne (Bioteau, 6 Mar 2006) — Le débourbage améliore le fruité des rosés](https://www.reussir.fr/vigne/le-debourbage-ameliore-le-fruite-des-roses) (opened; quality targets, not fermentation kinetics)
- [Wine with Seth — Punch down (pigeage)](https://www.winewithseth.com/winewiki/punch-down-pigeage/) (opened)
- [Grape solids: composition and impact on alcoholic fermentation (AGRIS record)](https://agris.fao.org/search/fr/records/68516bca53e52c13fc7676b2)
- [CRAAQ — Départ en fermentation](https://www.craaq.qc.ca/documents/files/evig1701/DEPART_EN_FERMENTATION.pdf)
- [White wine vinification and pellicular macerations: bibliometric and bibliographic review (EBSCO record)](https://www.ebsco.com/articles/nutrition-and-dietetics/f7e09c4f-6ad7-5142-91f6-52cc2d5e084f/white-wine-vinification-and-an-expanded-insight-into-pellicular-macerations-bibliometric-and-bibliographic-review/)
- [Wine with Seth — Pied de cuve](https://www.winewithseth.com/winewiki/pied-de-cuve/)
- [Università di Palermo, FitForThem — pied de cuve research](https://fitforthem.unipa.it/subject:Pied%20de%20cuve)
- [Austrian Wine — Biodynamic viticulture](https://www.austrianwine.com/our-wine/environmental-consciousness-in-austrian-viticulture/biodynamic-viticulture)
- [Certipaq (2022) — Guide des pratiques de vinification en agriculture biologique](https://www.certipaq.com/wp-content/uploads/2023/04/BIO_Guide_Vinification_18072022.pdf) (opened; the Annex V tables are images and could not be read)
- [OENO One (2020) — drought, YAN and wine typicity (DOAJ record)](https://doaj.org/article/f652a09d31534973adbbaea0846bc8cd)
- [Agroscope — Fattori che influenzano la nutrizione azotata della vite](https://www.agroscope.admin.ch/dam/agroscope/fr/dokumente/aktuell/kurznews/2017/fattori-influenzano-nutrizione-azotata-vite.pdf.download.pdf/fattori-influenzano-nutrizione-azotata-vite.pdf)
- [DPIRD Western Australia — Monitoring vine water status, part 2](https://dpird-web.matrix.squiz.cloud/__data/assets/pdf_file/0006/1182183/Monitoring-vine-water-status-part-2.pdf)

Opened but not readable (binary PDF; reference only):

- [IFV — Itinéraire 18: Fermentations](https://www.vignevin.com/wp-content/uploads/2020/01/Itin18_Fermentations.pdf)
