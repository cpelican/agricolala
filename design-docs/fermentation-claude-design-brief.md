# Claude Design brief — Cantina, the fermentation app

Paste everything below the line into Claude Design. Product background: [design-docs/fermentation.md](fermentation.md); how the two apps fit together: [design-docs/monorepo.md](monorepo.md) (PR #113).

---

## What you are designing

**Cantina** is a mobile web app for small winegrowers to follow the alcoholic fermentation of their wine, vat by vat. It is the cellar companion of **Agricolala**, an existing app for the vineyard (parcels, treatments, disease risk). Same users, same login, same data, separate apps. Cantina must look like part of the same family: **use Agricolala's design system as is** (tokens, type, components, layout). Do not invent a new palette or a new component style.

Design the v1 screens listed below, mobile first (375 px wide), with the desktop variant of the main screen.

## Who uses it, and where

- Small winegrowers, mostly in Italy, many working organically or biodynamically. They ferment spontaneously (with the grapes' own yeasts) whenever they can.
- They use it **in the cellar, on their phone, standing next to the vat, often with wet or sticky hands**, sometimes in poor light. Typing must be minimal; numbers must be big; targets must be large (at least 44 px, Agricolala's nav items are 52 px tall).
- They read sugar with a **Babo hydrometer** (°Babo, e.g. 21.5 at the start, going down to 0 and slightly negative, about −1, at the end) and a thermometer, once or twice a day.
- The app is in **Italian and English**. Design with Italian copy (examples below) and make sure longer Italian labels fit.

## Agricolala's design system (follow it)

**Colours** (Tailwind 4 tokens from `app/globals.css`, light mode only):

| Role | Token / value |
| --- | --- |
| Primary (dark leaf green) | `--primary` = `hsl(136 100% 21%)`; scale `primary-10` … `primary-950` mixed from it. Titles in `primary-700` (#004b14), active nav background `primary-50` |
| Page background (app) | `primary-10` (a barely green white); cards on white (`--card`) |
| Text | `foreground` (near black), body `neutral-700`, secondary `muted-foreground` / `neutral-600` |
| Borders | `--border` `hsl(0 0% 89.8%)`, radius `--radius` 0.5 rem (cards `rounded-lg`) |
| Notices | `warning` / `warning-background` / `warning-border` (amber), `success` (green), `info` (blue), `destructive` (red, white text on it) |
| Risk scale (5 steps, each darker than the last so they read apart without colour) | `risk-none` grey, `risk-low` light green, `risk-medium` yellow, `risk-high` orange, `risk-very-high` dark red |
| Grape colours already used in pictograms | green `#1a9e1a`, yellow `#f2b01e`, purple `#4b3aa6` |

**Type:** Inter. Text styles (from `components/ui/typography.ts`):

- Page title: bold, `primary-700`, 30 px, line-height 1.1, letter-spacing −0.02em.
- Section title: same, 24 px.
- Eyebrow above a title: 12 px, medium, uppercase, letter-spacing 0.06em, `neutral-600`.
- Body under a title: 16 px, `neutral-700`.
- Card section header: 14 px semibold with a 16 px muted Lucide icon before it.

**Components** (shadcn/ui, already in the codebase): Button (default = primary green with a soft green shadow, outline, ghost, destructive), Card, Badge, Dialog, Alert Dialog, Popover, Tooltip, Select, Radio Group, Checkbox, Input, Label, Calendar, Toast, Skeleton, Progress, Chart (Recharts). Primary call to action: 48 px tall, sized to its label, **never stretched across the phone width**. Icons: **Lucide** only.

**Experimental label:** a small pill (white, grey border, 11 px, flask icon, "Sperimentale"). Agricolala puts it next to anything computed from models rather than measured. The "normal fermentation" band and all advice must carry it.

**Layout shell:**

- Mobile: 64 px header with the logo and the wordmark (20 px bold text filled with a gradient from `primary-700` to lime), content on `primary-10`, **bottom navigation** fixed at the bottom (white, top border, items 52 px tall with a 22 px icon over a 12 px label; active item `primary-50` background, `primary-700` semibold text).
- Desktop (≥ 640 px): 20 rem left sidebar with the wordmark and the nav, content centred, max width 48 rem.
- Page header: eyebrow, page title, optional subtitle, optional action on the right.

## Screens to design (v1)

### 1. Shell and navigation

- Same shell as Agricolala, wordmark "Cantina" (same gradient treatment).
- Bottom navigation: **Vasche** (vats, home), **Profilo**, and a way back to **Agricolala** (the vineyard). Propose how the two apps link to each other (an app switcher in the header, or a nav item) without confusing the grower.

### 2. Vats list (home)

- One card per vat: name ("Vasca 1"), colour (bianco / rosato / rosso), fermentation mode (spontanea / pied de cuve / lieviti selezionati), days since start, last reading (e.g. "8,5 °Babo · 22 °C, 3 h fa"), and a **status chip**: Non partita, In corso, Rallenta, Ferma, Finita?, Troppo calda / Troppo fredda.
- A tiny sparkline of the Babo curve on each card is welcome if it stays readable.
- Primary action "Nuova fermentazione".
- Empty state for the first vintage.

### 3. New fermentation (two steps)

- **Step 1, one screen, 7 questions, with defaults:** name of the vat; colour (white / rosé / red); how it will ferment (**spontaneous, preselected**, pied de cuve, selected yeast); rules followed (**biodynamic, preselected**, organic, conventional); harvest date; start date (today); first reading (Babo and temperature). Prefer big segmented choices over dropdowns.
- **Step 2, "Aggiungi dettagli", skippable:** volume (litres), varieties, hand or machine harvest, grape health (healthy / some rot / much rot) and sorting, skin contact (*macerazione pellicolare*, hours or days), destemmed or whole bunches, cap management (reds), protection at crush (nothing / argon / SO₂), pied de cuve or yeast details, vat material, cooling/heating available, must analysis (pH, acidity, YAN, sugar), target style (dry / off-dry / sweet), malolactic planned. Only the questions that apply to the colour and mode appear.

### 4. Vat page (the main screen, also design the desktop variant)

- Header: vat name, colour and mode as small badges, status chip, days since start.
- **The fermentation chart**, the heart of the app:
  - Babo on the left axis (from the first reading down to about −2), time in days on the horizontal axis.
  - Temperature as a second, lighter line on a right axis, with the recommended range for the vat's colour shaded faintly (whites roughly 12–18 °C, reds 20–28 °C).
  - A shaded **"normal fermentation" band** behind the readings: flat during the start delay (longer for spontaneous), then a steep drop, then a tail to the plateau. Readings inside the band look calm; when the readings sit above it (slower than normal), the chart makes it obvious without relying on colour only.
  - **Additions** as markers on the time axis (yeast hulls, pied de cuve, yeast, argon, SO₂, aeration), each with its own small icon and a tooltip.
  - Readable at 375 px; tap a point to see the reading.
- Latest reading in large numbers, with "Aggiungi lettura" as the primary action, always reachable with one thumb.
- **Advice card** (see 6).
- Readings list (date, Babo, °C, pH) and additions list, editable.

### 5. Add reading / add addition (dialogs or bottom sheets)

- **Reading:** date and time defaulting to now; Babo with a big numeric keypad, **negative values allowed** (make the minus sign easy); temperature; optional pH. One tap to save.
- **Addition:** kind (yeast hulls, pied de cuve, yeast, nutrient, aeration, argon, SO₂, other), product name, dose in g/hL. When the vat's volume is known, show the grams to weigh ("30 g/hL × 12 hL = 360 g").

### 6. Advice and the "advice ladder"

Advice always starts at the biodynamic level and only escalates when the fermentation is in trouble. Each advice has a level:

1. **Biodinamico**: e.g. "Buon momento per le scorze di lievito (Demeter/bio, 20–40 g/hL)", "Proteggi il mosto con argon", "Niente solforosa durante la fermentazione", "Fermentazione finita? Conferma con un'analisi degli zuccheri (< 2 g/L)", "Solforosa a fine fermentazione: 4–6 g/hL, resti sotto il limite Demeter".
2. **Biodinamico, con approvazione del certificatore**: e.g. thiamine; certified-organic neutral yeast for a stuck fermentation with ≤ 50 g/L of sugar.
3. **Biologico (perde Demeter)**: e.g. selected organic yeast, DAP.
4. **Convenzionale (perde il biologico)**.

Design:

- The advice card: the level as a clear badge, the advice, why ("La curva rallenta da 2 giorni"), the source on tap, and the experimental label. Wording is always "considera", never an order.
- An **SO₂ meter**: SO₂ added so far against the limit for the vat (e.g. 40 of 100 mg/L for a dry red under Demeter), labelled "almeno" because yeasts make some too.
- The **opt-in to non-biodynamic advice** (levels 3–4): a deliberate action ("Mostra opzioni non biodinamiche") opening a confirmation that says plainly which certification the vat would lose. It must feel serious but not alarming, and it must be reversible only by the grower.

### 7. States to show

- Spontaneous vat on day 2, not started yet but still inside its normal window (calm, reassuring).
- Normal fermentation in full swing.
- Slowing: readings above the band for two days, level-1 advice shown.
- Stuck at 5 °Babo: level-2 advice, opt-in available.
- Finished: plateau around −1 °Babo, "confirm with a sugar test", SO₂ advice.
- Red vat at 33 °C: temperature alert.

## Constraints

- Agricolala's tokens and components only. A wine or grape purple may be used **inside the chart** (e.g. for the Babo line or the band), taken from the existing grape purple `#4b3aa6`; nowhere else.
- Status and levels must never rely on colour alone: label, icon or pattern too. Text contrast at least 4.5:1.
- One primary action per screen. Dialogs over full pages for quick entry.
- No dark mode. No marketing visuals. No stock photos.
- Numbers use the Italian format (comma decimals, °Babo, °C, g/hL, mg/L).

## Deliverables

1. Vats list (with and without vats).
2. New fermentation, step 1 and step 2.
3. Vat page: mobile in the six states above, plus one desktop.
4. Add reading and add addition.
5. Advice card for each level, the SO₂ meter, the non-biodynamic opt-in confirmation.
6. The navigation between Cantina and Agricolala.

Note any choice where you departed from Agricolala's system, and why.
