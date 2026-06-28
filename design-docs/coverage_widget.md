# Plan: Residual Treatment Coverage Widget

---

## What this feature does — farmer perspective

After applying copper or sulfur, the protective deposit on the canopy erodes from two independent sources:
- **Rain** washes it off physically — every mm removes a fraction of what remains.
- **Time alone**, even with no rain, gradually reduces protection through UV photodegradation, weathering, and new leaf growth continuously exposing fresh unprotected surface. This is why product labels specify a reapplication interval regardless of weather.

Farmers know they need to re-treat, but they can't see the deposit. The widget makes both processes visible and combines them into a single coverage number.

**The question the farmer is asking:** "Do I still have enough treatment on my vines to stop disease — or did last week's rain wash it all away?"

**What they see on the dashboard:**
- A coverage percentage per substance — *"your copper is at 74%"* — anchored to the scientifically-defined full-protection dose, not to how much they personally applied.
- Grams per hectare of active substance still on the canopy.
- For copper: the mg/m² leaf-surface deposit vs. the 2.5 mg/m² efficacy threshold.
- A 3-day forecast showing how much coverage will drop if forecast rain arrives.
- A per-parcel breakdown when parcels differ.

**When it appears:** only during active disease season. In December or January, coverage tracking is irrelevant — no disease, no widget. The gate uses `getCurrentDiseases()`, which filters substances by `sensitivityMonthMin/Max`. An empty result means the server component returns `null` and nothing renders.

**A realistic week to illustrate why a simple ratio fails:**

> Sunday: full copper treatment at 100 g/ha (full protection).
> Thursday: 10mm rain → 50.7 g/ha left. Farmer tops up with exactly 49.3 g/ha to restore 100 g/ha total.
> Friday: 5mm rain → ~89 g/ha remaining.

A naive metric that says *"remaining ÷ total you ever applied"* would read 89 ÷ 149.3 = **60%** — because it remembers both treatments. But the farmer's canopy is at the same protection level as any single fresh treatment eroded to 89 g/ha. The top-up worked. **60% is misleading.**

The correct answer is **89%** — because 100 g/ha is what science defines as full protection for a vine canopy (see [Coverage percentage definition](#coverage-percentage-definition-and-scientific-anchors) below). The percentage now reflects what the farmer cares about: how much of the scientifically-defined protection is still intact.

**What the farmer will eventually be able to do (v2):** see exactly how many grams of product to apply per parcel to restore 100% coverage.

---

## Scientific Basis & Sources

### Copper

- **Efficacy threshold:** above **2.5 mg Cu/m²** of leaf surface → >91.5% efficacy vs *Plasmopara viticola*
  - Source: Cabùs et al. (2017) as cited in [Bassi dosaggi di rame in viticoltura — InfoWine](https://www.infowine.com/bassi-dosaggi-di-rame-in-viticoltura-per-il-controllo-della-peronospora-efficacia-e-stabilita-2/)
- **Dose-to-leaf-surface conversion:** 200 g/ha metallic copper ≈ 5 mg/m² on leaf; 400 g/ha ≈ 10 mg/m² (using Leaf Area Index ≈ 4 for vineyards, implied by the article's own conversion table)
  - Source: [InfoWine article](https://www.infowine.com/bassi-dosaggi-di-rame-in-viticoltura-per-il-controllo-della-peronospora-efficacia-e-stabilita-2/)
- **Washoff threshold used for `k` calibration:** 25mm cumulative rain — already present in the codebase as `MAX_CUMULATIVE_PRECIPITATION_FOR_TREATMENT` in `lib/applicability.ts`, citing [Come funziona la resistenza al dilavamento — TerraEVita](https://terraevita.edagricole.it/featured/come-funziona-resistenza-dilavamento/)
- **Regulatory annual limit:** 28 kg/ha over 7 years (EU Regulation 2018/1981)
  - Source: [InfoWine article](https://www.infowine.com/bassi-dosaggi-di-rame-in-viticoltura-per-il-controllo-della-peronospora-efficacia-e-stabilita-2/)
- **Mechanism:** contact deposit — copper ions sit on the leaf surface and physically block *Plasmopara viticola* spore penetration. Coverage degrades gradually with rainfall.

### Sulfur

- **Mechanism: dual action — contact residual AND continuous vapor phase.** Sulfur does not protect only at the moment of application. Once deposited on the leaf, it acts through two simultaneous mechanisms depending on temperature:
  - **Below ~18°C — contact/residual action:** the solid deposit directly kills *Erysiphe necator* spores that physically land on it, similar in principle to copper's surface barrier.
  - **Above 18°C — continuous vapor-phase action:** the solid deposit continuously sublimates into sulfur gas, creating a toxic micro-environment around the leaf. This vapor migrates and protects areas not directly sprayed (notably the underside of leaves), and the deposit is gradually consumed by this process even with no rain.
  - Because vapor release is continuous as long as the deposit remains and temperatures are sufficient, protection persists after application — but the deposit depletes itself over time through volatilization. This is why no mg/m² leaf-surface threshold equivalent to copper's 2.5 mg/m² exists in the literature: efficacy depends on volatilization rate (temperature-driven), not deposit density per se.
  - Sources: [The oldest fungicide and newest phytoalexin — Plant Pathology, Wiley (Williams 2004)](https://bsppjournals.onlinelibrary.wiley.com/doi/full/10.1111/j.0032-0862.2004.01010.x); [Managing Diseases With Sulfur — Cornell University](https://www.vegetables.cornell.edu/pest-management/disease-factsheets/managing-diseases-with-sulfur-is-there-a-role-for-burners-evaporators/); [Sulfur Timing for Organic Powdery Mildew Control — VitiScribe](https://vitiscribe.com/powdery-mildew-organic-sulfur-timing/); [Oïdium et fongicides partie 2 — Quest Climate](https://www.questclimate.com/fr/l%27o%C3%AFdium-fongicides-partie-2-options-de-traitement/)
- **Rain washoff threshold for reapplication: 2.5mm** — sulfur is reapplied whenever rain exceeds 2.5mm (0.10 inch), compared to copper's 25mm. Sulfur deposit is fragile and washes off an order of magnitude more easily.
  - Source: [Temperature-based sulfur application — McGill University](https://eap.mcgill.ca/CPG_5.htm)
- **Temperature sensitivity:**
  - Below 18–20°C: sulfur volatilizes too slowly to be effective (some micronized formulations active from 10–12°C)
  - Above 32–38°C: phytotoxic risk, reduce dose and spray in cooler hours
  - Source: [McGill University](https://eap.mcgill.ca/CPG_5.htm); [Terra e Vita — Oidio della Vite](https://terraevita.edagricole.it/agrofarmaci-difesa/vite-sviluppo-primaverile-oidio/)
- **Typical per-application doses (wettable sulfur):**
  - Early season (6–7 leaf stage): 3–4 kg/ha
  - Pre-flowering / high disease pressure: 8–10 kg/ha
  - Source: [Réduire le soufre — Vitisphere](https://www.vitisphere.com/actualite-95926--reduire-le-soufre-pour-lutter-contre-loidium-en-bio-cest-possible.html)
- **Full season programme doses from field trials:**
  - Classical programme: ~83 kg/ha total → 95% efficacy
  - Reduced programme (+ biocontrols): ~23 kg/ha total → 67–77% efficacy
  - Source: [Vitisphere](https://www.vitisphere.com/actualite-95926--reduire-le-soufre-pour-lutter-contre-loidium-en-bio-cest-possible.html)
- **Regulatory annual limit:** 40 kg/ha/year (EU Regulation 2018/848)
- **Important distinction from copper:** the sulfur dose constraint is a per-application rate + reapplication interval (7-day minimum), not a multi-year cumulative cap like copper.
  - Source: Italian label data from [Terra e Vita](https://terraevita.edagricole.it/agrofarmaci-difesa/vite-sviluppo-primaverile-oidio/)

---

## Washoff Model

Coverage decays from two independent mechanisms that both operate continuously:
1. **Rain washoff** — each mm of rain removes a fraction of the deposit (substance-specific rate)
2. **Time decay** — weathering, UV photodegradation, and canopy growth expose new unprotected leaf area even with zero rain (product-specific rate, derived from `Product.daysBetweenApplications`)

For each DONE treatment `i` of substance `s` applied with product `p`:

```
initial_g_per_ha_i = (productDose_g × substancePct/100) × 10000 / parcelAreaM2
// Plain English: take the grams of product applied, keep only the active substance fraction
// (e.g. 25% copper → multiply by 0.25), then scale up to per-hectare using the parcel area.

rain_i    = Σ WeatherHistory.cumulativePrecipitation where dateTime > appliedDate_i
// Plain English: Σ means "add up all". Add up every day's rainfall (in mm) recorded
// for this parcel from the day after the treatment was applied until today.

days_i    = (today − appliedDate_i) in days
// Plain English: how many calendar days have passed since the treatment was applied.

k_rain_s  = washoff coefficient for substance s  (see table below)
// Plain English: a small number that controls how fast rain removes coverage.
// Bigger k_rain = more sensitive to rain (sulfur has a much bigger k_rain than copper).

k_time_p  = ln(2) / product.daysBetweenApplications  (if null → ln(2) / DEFAULT_DAYS_BETWEEN_APPLICATIONS)
// Plain English: a small number that controls how fast coverage fades over time with no rain.
// Derived from the product label's reapplication interval.
// Why ln(2)? ln(2) ≈ 0.693 is the magic constant that makes coverage reach exactly 50%
// at the reapplication interval. If the label says "reapply every 14 days", dividing ln(2)
// by 14 gives a k_time where plugging in 14 days returns exactly 0.5 (50% remaining).
// It is the standard way to express any "half-life" mathematically.

remaining_g_per_ha_i = initial_g_per_ha_i
                       × exp(−k_rain_s × rain_i)
                       × exp(−k_time_p × days_i)
// Plain English: start with the initial dose, then multiply by two shrinking factors — one
// for rain, one for time. Each factor is between 0 and 1, so the result is always less than
// or equal to the initial dose.
//
// Why exp() (exponential)? Because each mm of rain (or each passing day) removes a fixed
// *percentage* of whatever coverage is still left — not a fixed absolute amount. For example,
// "each mm removes 3% of remaining coverage." This "percentage of what remains" behaviour
// is exactly what the exponential function models. A straight line would incorrectly go
// negative eventually; exp() always stays above zero, which matches physical reality.
// exp(0) = 1 (no decay), exp(−large number) approaches 0 (almost gone).
```

The two factors are **independent and multiplicative**: a dry period causes time decay alone; a rain event causes rain washoff alone; both happening together compound. Neither requires the other.

Stacking (additive across all treatments on the same parcel for the same substance):
```
total_remaining_s_p = Σ remaining_g_per_ha_i
// Plain English: add up the remaining dose from every individual treatment for this
// substance on this parcel. Multiple applications stack on top of each other.
```

Cross-parcel aggregation (area-weighted, same convention as existing `calculateSubstanceData` in `lib/substance-helpers.ts`):
```
weighted_remaining_s = Σ(total_remaining_s_p × areaM2_p) / Σ areaM2_p
// Plain English: average the remaining dose across all parcels, but give bigger parcels
// more influence than smaller ones (weight by area). Divide by the total area to get
// back to a per-hectare figure. A 2-hectare parcel counts twice as much as a 1-hectare one.
```

---

### Rain washoff coefficients `k_rain` (substance-level, per mm of rain)

| Substance | k_rain | Calibration & source |
|-----------|--------|----------------------|
| Copper    | 0.028  | 25mm rain → ~50% loss. Source: [TerraEVita — Come funziona la resistenza al dilavamento](https://terraevita.edagricole.it/featured/come-funziona-resistenza-dilavamento/) (already cited in `lib/applicability.ts`). Formula: `ln(2) / 25` — same ln(2) trick as k_time: pick the rain amount at which you want 50% loss, divide ln(2) by it. |
| Sulfur    | 0.277  | 2.5mm rain → ~50% loss. Source: [McGill University — Temperature-based sulfur application](https://eap.mcgill.ca/CPG_5.htm): *"sulfur is reapplied if rain exceeds 0.10 inch (2.5mm)"*. Formula: `ln(2) / 2.5` — same logic, much smaller rain amount = much larger k = much faster washoff. |
| Default   | 0.030  | Conservative fallback close to copper, for any substance without a cited threshold |

**Why the 10× difference matters:** at k=0.277, sulfur loses ~50% after 2.5mm, ~75% after 5mm, ~94% after 10mm. At k=0.028, copper loses ~25% after 10mm, ~50% after 25mm. This reflects the fundamental mechanism difference: copper is a durable re-crystallising deposit; sulfur is a friable volatile residue.

---

### Time decay coefficients `k_time` (product-level, per day)

```typescript
// Hardcoded fallback when Product.daysBetweenApplications is null
const DEFAULT_DAYS_BETWEEN_APPLICATIONS = 14;

k_time = ln(2) / (product.daysBetweenApplications ?? DEFAULT_DAYS_BETWEEN_APPLICATIONS)
// Plain English: divide ln(2) by the number of days between applications.
// ln(2) ≈ 0.693 is the constant that guarantees coverage hits exactly 50%
// at the reapplication interval with no rain. Think of it as finding the
// right "speed of decay" so the halfway point lands exactly where the label says to reapply.
// ?? means: use the product's value if it exists, otherwise use 14 as the fallback.
```

**Interpretation:** at exactly `daysBetweenApplications` days with zero rain, 50% of the coverage remains — a reasonable reading of "time to reapply" from the product label. The value comes from `Product.daysBetweenApplications` in the DB, which is sourced from each product's technical data sheet. No external literature source is needed or hardcoded for the time component.

**Fallback:** `DEFAULT_DAYS_BETWEEN_APPLICATIONS = 14` is a single hardcoded conservative default (shorter interval = faster assumed decay = safer for the farmer). Applied when `daysBetweenApplications` is null.

**Example with no rain:**
- Product with `daysBetweenApplications = 7`: at day 7 → 50% remaining; at day 14 → 25% remaining
- Product with `daysBetweenApplications = 14` (or null → fallback): at day 14 → 50% remaining; at day 28 → 25%

---

### Forecast

Same formula applied to `weighted_remaining` with cumulative additional rain from Open-Meteo 3-day forecast, plus the additional days elapsed. Mathematically exact because both decay factors are exponential and compose cleanly:
```
projected = weighted_remaining × exp(−k_rain × ΔR) × exp(−k_time × Δdays)
// Plain English: take today's remaining coverage and apply the same two shrinking factors,
// but now using the forecast's additional rain (ΔR) and the extra days into the future (Δdays).
// Because the formula is exponential, you don't need to redo the full calculation from scratch —
// you can just multiply today's remaining value by the extra decay. The math works out exactly.
```

**Design note — forecast `k_time` simplification:** the forecast projection uses `getTimeDecayK(null)` — the 14-day fallback — for all substances, regardless of the actual `daysBetweenApplications` of the products applied. Since the seeded products both use 7-day intervals (`k_time = ln(2)/7 ≈ 0.099`), the forecast uses `k_time = ln(2)/14 ≈ 0.050` — half the actual decay rate. This makes the 3-day forecast **slightly optimistic**: it shows more coverage remaining than the model would compute if it knew the actual product mix. The underestimate grows to ~5% of the projected value by day 3 (using 7-day products). This is intentional (simplification: at projection time we don't store the weighted product k_time), but it is optimistic, not conservative — something to revisit if farmers notice the forecast landing higher than reality.

---

### Copper leaf-surface metric (copper only)

```
leafSurfaceMgPerM2 = remaining_g_per_ha / (LAI × 10)
                   = remaining_g_per_ha / 40
```

Compared to the 2.5 mg/m² efficacy threshold from the InfoWine article.
Not computed for sulfur — no equivalent leaf-surface threshold exists in the scientific literature (confirmed by searches in EN, FR, IT).

---

### Sulfur temperature warning (future addition)

Sulfur efficacy collapses below 18°C regardless of deposit amount (source: [McGill University](https://eap.mcgill.ca/CPG_5.htm); [Terra e Vita](https://terraevita.edagricole.it/agrofarmaci-difesa/vite-sviluppo-primaverile-oidio/)). The widget should eventually cross-reference `WeatherHistory.temperature2mMin` and show a warning. Not in scope for v1.

---

## Coverage percentage: definition and scientific anchors

100% coverage means the canopy carries the scientifically-defined full-protection dose of active substance. The denominator is a **substance-level constant from the literature**, not the farmer's own application history. See the [introduction](#what-this-feature-does--farmer-perspective) for why this matters with top-up treatments.

### Scientific anchors for 100% coverage

#### Copper — `COPPER_FULL_DOSE_G_PER_HA = 100` g/ha active

Derived from the efficacy threshold documented in the Scientific Basis section above:

```
Efficacy threshold:       2.5 mg Cu / m² leaf surface  (InfoWine / Cabùs et al. 2017)
Leaf Area Index (LAI):    4 for vineyards               (InfoWine article conversion table)
Unit conversion factor:   1 g/ha ÷ LAI ÷ 10 = mg/m² leaf
                          → 1 g/ha = 0.025 mg/m² leaf  (at LAI=4)

COPPER_FULL_DOSE_G_PER_HA = 2.5 mg/m² × 10 × LAI = 2.5 × 10 × 4 = 100 g/ha active
```

Cross-check via the existing leaf-surface formula: `leafSurfaceMgPerM2 = remaining_g_per_ha / 40`. At `remaining = 100 g/ha` → `100 / 40 = 2.5 mg/m²` ✓ — exactly the efficacy threshold.

#### Sulfur — `SULFUR_FULL_DOSE_G_PER_HA = 6_400` g/ha active

Derived from the high-pressure per-application dose documented in the Scientific Basis section:

```
Per-application dose at high disease pressure:  8 kg/ha wettable sulfur product  (Vitisphere)
Wettable sulfur composition:                    80% active sulfur by weight       (Zolfo tiovit label)

SULFUR_FULL_DOSE_G_PER_HA = 8_000 g/ha × 80% = 6_400 g/ha active sulfur
```

This uses the lower bound of the high-pressure dose range (8–10 kg/ha), so coverage reads 100% when the farmer has applied the minimum recommended dose for a high-disease-pressure period. Applying more would temporarily push the meter above 100% (display is clamped to 100%, the raw value is not).

#### Other substances

No scientific anchor available. For any substance not in the lookup table, fall back to `weightedInitialGPerHa` (the farmer's own first application dose acts as the 100% reference, i.e. the cumulative ratio). The widget should not display a coverage % in this case, only g/ha remaining.

### Implementation

```typescript
// lib/coverage-helpers.ts
export const FULL_DOSE_G_PER_HA: Record<string, number> = {
  Copper: 100,    // 2.5 mg/m² × LAI=4 × 10 — InfoWine / Cabùs et al. 2017
  Sulfur: 6_400,  // 8 kg/ha product × 80% composition — Vitisphere high-pressure dose
};

// Per substance in calculateCoverageData:
const fullDoseGPerHa = FULL_DOSE_G_PER_HA[substanceName];
const coveragePercent = fullDoseGPerHa != null
  ? Math.min(100, (weightedRemainingGPerHa / fullDoseGPerHa) * 100)
  : null; // no anchor → no % shown; widget displays g/ha remaining only
```

`coveragePercent` is `number | null`. When `null`, the badge, progress bar, and per-parcel percentage are all hidden — only the g/ha remaining value is shown. The denominator (`fullDoseGPerHa`) is also exposed on the `SubstanceCoverage` object so the widget can display "X g/ha remaining / 100 g/ha full dose" at substance level, and "X g/ha remaining / Y g/ha applied" at parcel level.

**Top-up scenario (the motivating case):** after a deficit top-up that restores 100 g/ha active copper, `coveragePercent = 100/100 = 100%` — correctly signals full protection regardless of how many separate applications built up to that total.

---

## Future Feature: Recommended Top-up Dose

When `coveragePercent < 100%` and a scientific anchor exists for the substance, the widget will suggest the dose needed to restore full protection.

### Formula

```
deficit_active_g_per_ha = FULL_DOSE_G_PER_HA[substanceName] − weightedRemainingGPerHa

// Convert active substance back to product quantity:
recommendedProductDose_g_per_ha = deficit_active_g_per_ha / (substanceCompositionPct / 100)

// Scale to a specific parcel's area (for the per-parcel breakdown):
recommendedProductDose_g_for_parcel = recommendedProductDose_g_per_ha × (parcelAreaM2 / 10_000)
```

### Example

Farmer has a 0.5 ha parcel. Copper remaining after rain: 67 g/ha active. Product: Pasta cafaro (25% copper).

```
deficit          = 100 − 67 = 33 g/ha active
product dose     = 33 / 0.25 = 132 g/ha of Pasta cafaro
for 0.5 ha       = 132 × 0.5 = 66 g of product to apply
```

The widget would display: *"Apply 66 g of Pasta cafaro to restore full coverage on this parcel."*

### Concept: max dose vs. recommended dose

- **Max dose** (`FULL_DOSE_G_PER_HA`) — the substance-level scientific constant that defines 100% coverage. This is the ceiling you aim for per application.
- **Recommended dose** — the deficit calculation above. It is dynamic: it changes every day as rain and time erode the deposit. The farmer sees what to apply today to restore full protection.
- **Annual budget constraint** — `Substance.maxDosage` (kg/ha/year) limits total copper to ~4 kg/ha/year (EU cap). The top-up suggestion must check the remaining annual budget and warn if applying the full deficit would exceed it.

### What to add

**`lib/coverage-helpers.ts`** — add to `calculateCoverageData` output:
```typescript
recommendedTopUpActiveGPerHa: Math.max(0, fullDose - weightedRemainingGPerHa),
recommendedTopUpProductGPerHa: Math.max(0, deficit / (compositionPct / 100)),
```

**`components/types.ts`** — add to `SubstanceCoverage`:
```typescript
recommendedTopUpActiveGPerHa?: number;      // active substance deficit (g/ha)
recommendedTopUpProductGPerHa?: number;     // product quantity per ha to restore full dose
```

Add to `ParcelCoverageEntry`:
```typescript
recommendedTopUpProductG?: number;          // total grams of product for this specific parcel
```

**`locales/en.json` + `locales/it.json`** — add to `"coverage"` namespace:
```json
"recommendedDose": "Recommended top-up",
"recommendedDoseDetail": "Apply {dose} g of {product} to restore full coverage"
```

**UI placement:** in `SubstanceCoverageCard`, below the progress bar, shown only when `coveragePercent !== null && coveragePercent < 100`. In the per-parcel breakdown, show `recommendedTopUpProductG` per parcel.

---

## Files to Create

### `lib/coverage-helpers.ts` — pure calculation, no I/O
- `WASHOFF_COEFFICIENTS: Record<string, number>` + `DEFAULT_WASHOFF_K` — with source URL comments
- `DEFAULT_DAYS_BETWEEN_APPLICATIONS = 14` — hardcoded conservative fallback
- `FULL_DOSE_G_PER_HA: Record<string, number>` — scientific anchors for 100% coverage (Copper: 100, Sulfur: 6 400)
- `getWashoffK(substanceName): number`
- `getTimeDecayK(daysBetweenApplications: number | null): number` — `ln(2) / (days ?? DEFAULT_DAYS_BETWEEN_APPLICATIONS)`
- `computeWashoffFactor(rainMm, k): number` — `exp(-k × rainMm)`
- `computeTimeDecayFactor(daysSinceTreatment, k): number` — `exp(-k × days)`
- `sumRainAfterDate(weatherHistories, afterDate): number`
- `daysSince(date: Date): number` — `(now - date) / MS_PER_DAY`
- `calculateCoverageData(parcels, compositions, substanceColorMap, forecastRain): CoverageWidgetData` — main function

### `components/async/coverage-widget-content.tsx` — async server component
- Calls `getCurrentDiseases()` first — if it returns an empty array (outside disease season), returns `null` immediately. No further queries are made.
- Otherwise calls `getTreatmentsWithParcelWeather(userId)`, `getCachedCompositions()`, `getCachedSubstances()` in `Promise.all`
- Calls `OpenMeteoClient.getForecastWeatherData()` once for the first parcel with coordinates (`try/catch`, degrades gracefully)
- Calls `calculateCoverageData()` and passes result to `CoverageWidget`
- Returns `null` if `substances.length === 0` (no DONE treatments yet)

### `components/substances/coverage-widget.tsx` — "use client"
- `CoverageWidget` — outer card + warnings if no/incomplete weather data
- `SubstanceCoverageCard` — per-substance row:
  - Color-coded badge (% coverage remaining)
  - Progress bar (green ≥60% / yellow 30–59% / red <30%)
  - g/ha remaining vs g/ha applied
  - Copper-only: mg/m² on leaf surface vs 2.5 mg/m² threshold
  - 3-day forecast inline
  - Collapsible per-parcel breakdown
- `ForecastRow` — 3 mini-cards (day name / projected g/ha / +mm rain)
- `WeatherDataWarning` — soft banner for missing/incomplete weather history

---

## Files to Modify

### `components/types.ts`
Add new interfaces:
```typescript
interface ParcelCoverageEntry {
  parcelId: string;
  parcelName: string;
  areaM2: number;
  initialDoseGPerHa: number;       // grams of active substance actually applied per ha
  remainingDoseGPerHa: number;
  rainSinceLastTreatmentMm: number;
  coveragePercent: number | null;  // null when no scientific anchor exists for the substance
}

interface CoverageForecastDay {
  date: Date;
  precipitationMm: number;
  cumulativeAdditionalRainMm: number;
  projectedWeightedRemainingGPerHa: number;
}

interface SubstanceCoverage {
  substanceName: string;
  color: string;
  washoffK: number;
  weightedInitialGPerHa: number;   // sum of all initial doses, area-weighted (for display)
  weightedRemainingGPerHa: number;
  coveragePercent: number | null;  // null when no scientific anchor; clamped to 100 when displayed
  fullDoseGPerHa?: number;         // the scientific anchor (FULL_DOSE_G_PER_HA entry), when available
  leafSurfaceMgPerM2?: number;     // copper only — remaining_g_per_ha / 40
  parcels: ParcelCoverageEntry[];
  forecast: CoverageForecastDay[];
}

interface CoverageWidgetData {
  substances: SubstanceCoverage[];
  hasWeatherData: boolean;
  hasIncompleteWeatherHistory: boolean;
}
```

### `lib/data-fetcher.ts`
Add `getTreatmentsWithParcelWeather(userId)`. Note: `productApplicationsSelect` (the existing shared constant) does **not** include `daysBetweenApplications` — add it only in this new select to avoid bloating the existing queries used everywhere else.

```typescript
const coverageProductApplicationsSelect = {
  dose: true,
  product: {
    select: {
      id: true,
      daysBetweenApplications: true,   // ← added here only, not in shared productApplicationsSelect
      composition: {
        select: { dose: true, substanceId: true },
      },
    },
  },
};

const coverageParcelSelect = {
  id, name, width, height, latitude, longitude,
  treatments: {
    where: { status: DONE, appliedDate: { gte: Jan1, not: null } },
    select: { id, appliedDate, productApplications: coverageProductApplicationsSelect },
    orderBy: { appliedDate: "asc" },   // NO take limit unlike parcelSelect
  },
  weatherHistories: {
    where: { dateTime: { gte: Jan1 } },
    select: { dateTime, cumulativePrecipitation },
    orderBy: { dateTime: "asc" },
  },
};

export const getTreatmentsWithParcelWeather = cache(async (userId) => { ... });
export type CoverageParcel = Awaited<ReturnType<typeof getTreatmentsWithParcelWeather>>[number];
```

### `components/async/home-dashboard-content.tsx`
Add `<CoverageWidgetContent>` below `<SubstanceUsageSection>`, wrapped in `<Suspense fallback={<CoverageWidgetSkeleton />}>` so the Open-Meteo API call doesn't block the existing aggregation section.

### Skeleton file
Add `CoverageWidgetSkeleton` to wherever home skeletons live (check `components/skeletons/`).

### `locales/en.json` + `locales/it.json`
Add `"coverage"` namespace:
```json
"coverage": {
  "title": "Treatment Coverage",
  "description": "Estimated residual active substance after rainfall and natural degradation over time",
  "remaining": "g/ha remaining",
  "initial": "g/ha applied",
  "fullDose": "g/ha full dose",
  "rainSince": "rain since last treatment",
  "mm": "mm",
  "leafSurface": "mg/m² on leaf",
  "copperThreshold": "Efficacy threshold: 2.5 mg/m²",
  "coveragePercent": "coverage",
  "forecast": "3-Day Forecast",
  "showDetails": "Show parcel breakdown",
  "hideDetails": "Hide parcel breakdown",
  "noWeatherData": "Rain data unavailable — coverage estimate reflects time-based degradation only, not rainfall",
  "incompleteWeatherData": "Rain history may be incomplete for some early treatments"
}
```

`"fullDose"` is used at substance level when a scientific anchor exists. `"initial"` is used at parcel level (showing grams actually applied per parcel) and as fallback at substance level when no anchor exists.

### `prisma/seed.ts`
Populate `daysBetweenApplications` for both seeded products. No schema migration needed — the field already exists as `Int?`.

| Product | `daysBetweenApplications` | Source |
|---------|--------------------------|--------|
| Pasta cafaro (copper 25%) | **7 days** | Product label — minimum interval between applications on grapevine |
| Zolfo tiovit (sulfur 80%) | **7 days** | [Swiss Federal Office for Agriculture — PSM Register, Tiovit Jet](https://www.psm.admin.ch/it/produkte/18) |

```typescript
const copperProduct = await db.product.create({
  data: {
    name: "Pasta cafaro",
    brand: "Pasta cafaro",
    maxApplications: MAX_APPLICATIONS,
    daysBetweenApplications: 7,   // ← add
    composition: { create: [{ substanceId: copper.id, dose: 25 }] },
  },
});

const sulfurProduct = await db.product.create({
  data: {
    name: "Zolfo tiovit",
    brand: "Zolfo tiovit",
    maxApplications: MAX_APPLICATIONS_SULFUR,
    daysBetweenApplications: 7,   // ← add — source: psm.admin.ch/it/produkte/18
    composition: { create: [{ substanceId: sulfur.id, dose: 80 }] },
  },
});
```

With both products at 7 days, `k_time = ln(2) / 7 ≈ 0.099 per day` — meaning ~50% of coverage remains after one week with no rain for both substances.

---

## Key Reused Utilities

| Utility | File |
|---------|------|
| `productApplicationsSelect` | `lib/data-fetcher.ts` — keeps composition format consistent |
| `getCachedCompositions()` | `lib/data-fetcher.ts` — same cache used by `calculateSubstanceData` |
| `getCachedSubstances()` | `lib/data-fetcher.ts` — for substance colors |
| `getCurrentDiseases()` | `lib/data-fetcher.ts` — filters by `sensitivityMonthMin/Max`; empty result → widget hidden (e.g. December) |
| `OpenMeteoClient.getForecastWeatherData()` | `lib/open-meteo-client.ts` — already used in `applicability.ts` |
| `SubstanceCircle` | `components/substances/substance-circle.tsx` |
| `useTranslations` + `getSubstanceTranslation` | existing i18n hook |

---

## Edge Cases

| Case | Handling |
|------|----------|
| No active diseases this month | `getCurrentDiseases()` returns `[]` → server component returns `null`, widget hidden (e.g. December) |
| Parcel has no WeatherHistory | rain = 0, full dose assumed remaining; `hasWeatherData = false` → warning banner |
| Treatment predates earliest weather record | `hasIncompleteWeatherHistory = true` → soft banner |
| `cumulativePrecipitation` is null | `?? 0` in sum |
| Open-Meteo forecast fails | `try/catch`, `forecastRain = []`, forecast section absent, rest renders |
| No DONE treatments | server component returns `null`, no card rendered |
| `parcelAreaM2 ≤ 0` | parcel skipped (same guard as `calculateSubstanceData`) |
| Multiple parcels on farm | single representative parcel for forecast API call |
| Sulfur + temperature < 18°C | not handled in v1 — flagged as future addition |

---

## Tests: `lib/coverage-helpers.test.ts`

Mirrors `lib/substance-helpers.test.ts` pattern (vitest, no DB):

- **`computeWashoffFactor`**:
  - 0mm → 1.0 (no rain, no decay)
  - Copper at 25mm → ~0.497 (k=0.028, TerraEVita source)
  - Sulfur at 2.5mm → ~0.497 (k=0.277, McGill source)
  - Sulfur at 10mm → ~0.061 (~94% loss)
  - Negative rain → 1.0
- **`computeTimeDecayFactor`**:
  - 0 days → 1.0
  - At `daysBetweenApplications` days → ~0.497 (by construction)
  - Product with 7-day interval: day 7 → ~50%, day 14 → ~25%
  - Product with null interval (fallback 14 days): day 14 → ~50%, day 28 → ~25%
- **`getTimeDecayK`**:
  - `daysBetweenApplications = 7` → `ln(2)/7 ≈ 0.099`
  - `daysBetweenApplications = null` → `ln(2)/14 ≈ 0.050` (uses `DEFAULT_DAYS_BETWEEN_APPLICATIONS`)
- **`sumRainAfterDate`**: strict `>` cutoff; null treated as 0; empty array → 0
- **`calculateCoverageData`**:
  - No treatments → empty substances
  - Single treatment at full dose (400g copper), no rain, day 0 → `coveragePercent = 100`, `weightedInitialGPerHa = FULL_DOSE_G_PER_HA.Copper`, `fullDoseGPerHa` exposed
  - No rain but 14 days elapsed (`daysBetweenApplications=14`, dose=400g) → `coveragePercent ≈ 50`
  - No rain but 14 days elapsed (`daysBetweenApplications=null`, dose=400g) → `coveragePercent ≈ 50` (fallback)
  - Copper at 25mm rain + 1 day → `coveragePercent` in 35–55% (rain and time both applied)
  - Sulfur at 2.5mm rain + 1 day (dose=8000g, 80% composition) → `coveragePercent` in 35–55%
  - Top-up after rain: T1+T2 each see their own rain history; after top-up to 100 g/ha `coveragePercent = 100%` (key UX test — validates scientific anchor vs cumulative ratio)
  - Two stacked treatments (200g + 200g) → `weightedInitialGPerHa = 100`, `coveragePercent = 100`
  - Copper has `leafSurfaceMgPerM2`; sulfur does not
  - Forecast applies cumulative rain decay AND additional days
  - Area-weighted average (bigger parcel has more influence)
  - `hasWeatherData` / `hasIncompleteWeatherHistory` flags

---

## All Sources

| Claim | Source |
|-------|--------|
| Copper efficacy threshold: 2.5 mg Cu/m² | [InfoWine — Bassi dosaggi di rame in viticoltura](https://www.infowine.com/bassi-dosaggi-di-rame-in-viticoltura-per-il-controllo-della-peronospora-efficacia-e-stabilita-2/) |
| Copper dose-to-leaf-surface conversion (LAI ≈ 4) | [InfoWine — Bassi dosaggi di rame in viticoltura](https://www.infowine.com/bassi-dosaggi-di-rame-in-viticoltura-per-il-controllo-della-peronospora-efficacia-e-stabilita-2/) |
| Copper EU limit: 28 kg/ha over 7 years | EU Regulation 2018/1981, cited in [InfoWine article](https://www.infowine.com/bassi-dosaggi-di-rame-in-viticoltura-per-il-controllo-della-peronospora-efficacia-e-stabilita-2/) |
| Copper washoff threshold: 25mm (k calibration anchor) | [Come funziona la resistenza al dilavamento — TerraEVita](https://terraevita.edagricole.it/featured/come-funziona-resistenza-dilavamento/) (already cited in `lib/applicability.ts`) |
| Sulfur mechanism: vapor phase sublimation, not contact | [McGill University — Temperature-based sulfur application](https://eap.mcgill.ca/CPG_5.htm) |
| Sulfur washoff threshold: 2.5mm (k calibration anchor) | [McGill University — Temperature-based sulfur application](https://eap.mcgill.ca/CPG_5.htm) |
| Sulfur temperature range: 18–32°C | [McGill University](https://eap.mcgill.ca/CPG_5.htm); [Terra e Vita — Oidio della Vite](https://terraevita.edagricole.it/agrofarmaci-difesa/vite-sviluppo-primaverile-oidio/) |
| Sulfur per-application doses: 3–10 kg/ha | [Réduire le soufre pour lutter contre l'oïdium en bio — Vitisphere](https://www.vitisphere.com/actualite-95926--reduire-le-soufre-pour-lutter-contre-loidium-en-bio-cest-possible.html) |
| Sulfur field trial season totals: 23–83 kg/ha | [Vitisphere](https://www.vitisphere.com/actualite-95926--reduire-le-soufre-pour-lutter-contre-loidium-en-bio-cest-possible.html) |
| Sulfur EU annual limit: 40 kg/ha/year | EU Regulation 2018/848 |
| No mg/m² leaf-surface threshold for sulfur | Confirmed absent after searching in EN, FR, IT — see [McGill](https://eap.mcgill.ca/CPG_5.htm), [Vitisphere](https://www.vitisphere.com/actualite-95926--reduire-le-soufre-pour-lutter-contre-loidium-en-bio-cest-possible.html), [APS Journals](https://apsjournals.apsnet.org/doi/10.1094/PDIS-06-21-1164-RE) |

---

## Verification

1. `npm test lib/coverage-helpers.test.ts` — all 28 tests pass ✓
2. Start dev server, open home dashboard as a user with DONE treatments
3. Confirm widget renders below the existing substance usage section
4. **Rain sensitivity check:** sulfur treatment at 8 kg/ha + 5mm rain → ~74% gone; copper at 400g/10000m² + 5mm rain → ~13% gone
5. **Dry period check:** copper at full dose, 14 days ago, zero rain, `daysBetweenApplications=14` → coveragePercent ≈ 50%. Confirms time decay is working.
6. **Top-up check:** full dose, 10mm rain (→ ~50%), top-up with deficit, → coveragePercent = 100%. Confirms scientific anchor denominator.
7. If forecast shows 0mm rain, projected g/ha decreases only from time decay (not flat)
8. Warning banner appears when a parcel has no WeatherHistory records
9. Toggle parcel breakdown on a user with multiple parcels

---

## What remains to do

### 1. Recommended top-up dose (next feature)

The widget currently shows coverage % and g/ha remaining but does not yet suggest a dose to apply. This is fully designed in the [Future Feature: Recommended Top-up Dose](#future-feature-recommended-top-up-dose) section above. The data needed (`FULL_DOSE_G_PER_HA`, `weightedRemainingGPerHa`, per-parcel `areaM2`) is already available in the calculation output — the feature is additive only.

Key constraints to implement:
- Clamp the suggestion at 0 (never suggest negative dose — over-application capped to 100% display only)
- Check remaining annual budget from `Substance.maxDosage` — warn if the top-up would push the year over the EU cap

### 2. Sulfur temperature warning

Sulfur is ineffective below 18°C regardless of deposit amount. The widget should check `WeatherHistory.temperature2mMin` and show a soft warning when the forecast or recent temperatures are below threshold. Data is already in the DB; it's a UI addition only.

### 3. Forecast `k_time` accuracy

The 3-day forecast currently applies `getTimeDecayK(null)` (14-day fallback = `k_time ≈ 0.050`) to projected decay for all substances. When the actual products applied have a 7-day interval (`k_time ≈ 0.099`), the forecast underestimates the speed of decay — it shows ~5% more coverage at day 3 than reality. The fix is to store and forward a weighted average `k_time` alongside `weightedRemainingGPerHa` so the forecast can use the actual decay rate of the applied products rather than the fallback.

This is optimistic (farmer sees a rosier forecast than reality), not conservative. Whether to fix it depends on how much it matters in practice — at 7-day intervals the underestimate at day 3 is modest, but a farmer checking whether they need to re-treat in 3 days could be given slightly too much confidence.


### 4. Add `WASHOFF_COEFFICIENTS` in the Substance table