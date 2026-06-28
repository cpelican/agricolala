import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import {
	computeWashoffFactor,
	computeTimeDecayFactor,
	getTimeDecayK,
	sumRainAfterDate,
	calculateCoverageData,
	DEFAULT_DAYS_BETWEEN_APPLICATIONS,
	FULL_DOSE_G_PER_HA,
} from "./coverage-helpers";

// ---------------------------------------------------------------------------
// computeWashoffFactor
// ---------------------------------------------------------------------------

describe("computeWashoffFactor", () => {
	test("0mm rain → factor = 1 (no loss)", () => {
		expect(computeWashoffFactor(0, 0.028)).toBe(1);
	});

	test("negative rain → factor = 1 (clamped)", () => {
		expect(computeWashoffFactor(-5, 0.028)).toBe(1);
	});

	test("copper: 25mm → ~50% loss (k=ln(2)/25)", () => {
		const k = Math.LN2 / 25;
		expect(computeWashoffFactor(25, k)).toBeCloseTo(0.5, 3);
	});

	test("sulfur: 2.5mm → ~50% loss (k=ln(2)/2.5)", () => {
		const k = Math.LN2 / 2.5;
		expect(computeWashoffFactor(2.5, k)).toBeCloseTo(0.5, 3);
	});

	test("sulfur: 10mm → ~6% remaining (~94% loss)", () => {
		const k = Math.LN2 / 2.5;
		expect(computeWashoffFactor(10, k)).toBeCloseTo(0.0625, 3);
	});
});

// ---------------------------------------------------------------------------
// computeTimeDecayFactor
// ---------------------------------------------------------------------------

describe("computeTimeDecayFactor", () => {
	test("0 days → factor = 1 (no decay)", () => {
		expect(computeTimeDecayFactor(0, Math.LN2 / 7)).toBe(1);
	});

	test("negative days → factor = 1 (clamped)", () => {
		expect(computeTimeDecayFactor(-1, Math.LN2 / 7)).toBe(1);
	});

	test("7-day product: at day 7 → ~50% remaining", () => {
		const k = Math.LN2 / 7;
		expect(computeTimeDecayFactor(7, k)).toBeCloseTo(0.5, 3);
	});

	test("7-day product: at day 14 → ~25% remaining", () => {
		const k = Math.LN2 / 7;
		expect(computeTimeDecayFactor(14, k)).toBeCloseTo(0.25, 3);
	});
});

// ---------------------------------------------------------------------------
// getTimeDecayK
// ---------------------------------------------------------------------------

describe("getTimeDecayK", () => {
	test("7-day interval → ln(2)/7 ≈ 0.099", () => {
		expect(getTimeDecayK(7)).toBeCloseTo(Math.LN2 / 7, 6);
	});

	test("null → uses DEFAULT_DAYS_BETWEEN_APPLICATIONS fallback", () => {
		expect(getTimeDecayK(null)).toBeCloseTo(
			Math.LN2 / DEFAULT_DAYS_BETWEEN_APPLICATIONS,
			6,
		);
	});

	test("null fallback: at DEFAULT days → ~50% remaining", () => {
		const k = getTimeDecayK(null);
		expect(
			computeTimeDecayFactor(DEFAULT_DAYS_BETWEEN_APPLICATIONS, k),
		).toBeCloseTo(0.5, 3);
	});
});

// ---------------------------------------------------------------------------
// sumRainAfterDate
// ---------------------------------------------------------------------------

describe("sumRainAfterDate", () => {
	const afterDate = new Date("2025-06-10");
	const histories = [
		{ dateTime: new Date("2025-06-10"), cumulativePrecipitation: 5 }, // equal → excluded (strict >)
		{ dateTime: new Date("2025-06-11"), cumulativePrecipitation: 3 },
		{ dateTime: new Date("2025-06-12"), cumulativePrecipitation: null },
		{ dateTime: new Date("2025-06-13"), cumulativePrecipitation: 7 },
	];

	test("sums only records strictly after afterDate", () => {
		expect(sumRainAfterDate(histories, afterDate)).toBeCloseTo(10, 5);
	});

	test("null precipitation treated as 0", () => {
		const result = sumRainAfterDate(histories, afterDate);
		expect(result).toBe(10); // 3 + 0 + 7
	});

	test("empty array → 0", () => {
		expect(sumRainAfterDate([], afterDate)).toBe(0);
	});
});

// ---------------------------------------------------------------------------
// calculateCoverageData
// ---------------------------------------------------------------------------

// Fixed "now" so daysSince() is deterministic
const FIXED_NOW = new Date("2025-06-20T12:00:00Z");

beforeEach(() => {
	vi.useFakeTimers();
	vi.setSystemTime(FIXED_NOW);
});

afterEach(() => {
	vi.useRealTimers();
});

const compositions = {
	"substance-copper": {
		"product-copper": {
			substance: { name: "Copper", maxDosage: 4 },
			dose: 25,
			productId: "product-copper",
			substanceId: "substance-copper",
			id: "sd-1",
		},
	},
	"product-copper": {
		"substance-copper": {
			substance: { name: "Copper", maxDosage: 4 },
			dose: 25,
			productId: "product-copper",
			substanceId: "substance-copper",
			id: "sd-1",
		},
	},
	"substance-sulfur": {
		"product-sulfur": {
			substance: { name: "Sulfur", maxDosage: 10 },
			dose: 80,
			productId: "product-sulfur",
			substanceId: "substance-sulfur",
			id: "sd-2",
		},
	},
	"product-sulfur": {
		"substance-sulfur": {
			substance: { name: "Sulfur", maxDosage: 10 },
			dose: 80,
			productId: "product-sulfur",
			substanceId: "substance-sulfur",
			id: "sd-2",
		},
	},
};

const colorMap = { Copper: "rgb(59,130,246)", Sulfur: "rgb(34,197,94)" };

// compositionDose: percentage of active substance in the product (25 for copper, 80 for sulfur)
function makeParcel(overrides: {
	id?: string;
	width?: number;
	height?: number;
	treatmentDate?: Date;
	productId?: string;
	substanceId?: string;
	dose?: number;
	compositionDose?: number;
	daysBetweenApplications?: number | null;
	weatherHistories?: {
		dateTime: Date;
		cumulativePrecipitation: number | null;
	}[];
}) {
	const {
		id = "parcel-1",
		width = 100,
		height = 100, // 10 000 m²
		treatmentDate = new Date("2025-06-20"), // same as FIXED_NOW → days = 0
		productId = "product-copper",
		substanceId = "substance-copper",
		dose = 400, // g product — 400g × 25% = 100 g/ha = COPPER_FULL_DOSE on a 10 000m² parcel
		compositionDose = 25,
		daysBetweenApplications = 7,
		weatherHistories = [],
	} = overrides;

	return {
		id,
		name: `Parcel ${id}`,
		width,
		height,
		latitude: 45,
		longitude: 7,
		treatments: [
			{
				id: "t-1",
				appliedDate: treatmentDate,
				productApplications: [
					{
						dose,
						product: {
							id: productId,
							daysBetweenApplications,
							composition: [{ dose: compositionDose, substanceId }],
						},
					},
				],
			},
		],
		weatherHistories,
	};
}

describe("calculateCoverageData", () => {
	test("no treatments → empty substances", () => {
		const parcel = { ...makeParcel({}), treatments: [] };
		const result = calculateCoverageData([parcel], compositions, colorMap, []);
		expect(result.substances).toHaveLength(0);
	});

	test("single treatment at full dose, no rain, day 0 → 100% coverage", () => {
		// dose=400g product, 25% composition, 10 000m² → 400*0.25*10000/10000 = 100 g/ha = COPPER_FULL_DOSE
		const parcel = makeParcel({
			treatmentDate: FIXED_NOW,
			weatherHistories: [],
		});
		const result = calculateCoverageData([parcel], compositions, colorMap, []);
		expect(result.substances).toHaveLength(1);
		const sub = result.substances[0];
		expect(sub.weightedInitialGPerHa).toBeCloseTo(FULL_DOSE_G_PER_HA.Copper, 2);
		expect(sub.weightedRemainingGPerHa).toBeCloseTo(
			FULL_DOSE_G_PER_HA.Copper,
			2,
		);
		expect(sub.fullDoseGPerHa).toBe(FULL_DOSE_G_PER_HA.Copper);
		expect(sub.coveragePercent).toBeCloseTo(100, 1);
	});

	test("no rain but 14 days elapsed (daysBetweenApplications=14) → ~50% remaining", () => {
		// Use exact UTC timestamp so daysSince() returns exactly 14.0 days.
		// dose=400g → starts at COPPER_FULL_DOSE (100 g/ha). At 14 days with 14-day product:
		// remaining = 100 * exp(-ln(2)/14 * 14) = 100 * 0.5 = 50 g/ha → 50% of full dose.
		const treatmentDate = new Date("2025-06-06T12:00:00Z");
		const parcel = makeParcel({
			treatmentDate,
			daysBetweenApplications: 14,
			weatherHistories: [
				{
					dateTime: new Date("2025-06-06T12:00:00Z"),
					cumulativePrecipitation: 0,
				},
			],
		});
		const result = calculateCoverageData([parcel], compositions, colorMap, []);
		const sub = result.substances[0];
		expect(sub.coveragePercent).toBeCloseTo(50, 1);
	});

	test("no rain but 14 days elapsed (daysBetweenApplications=null) → ~50% remaining (fallback)", () => {
		const treatmentDate = new Date("2025-06-06T12:00:00Z");
		const parcel = makeParcel({
			treatmentDate,
			daysBetweenApplications: null,
			weatherHistories: [
				{
					dateTime: new Date("2025-06-06T12:00:00Z"),
					cumulativePrecipitation: 0,
				},
			],
		});
		const result = calculateCoverageData([parcel], compositions, colorMap, []);
		const sub = result.substances[0];
		expect(sub.coveragePercent).toBeCloseTo(50, 1);
	});

	test("copper: 25mm rain reduces coverage to ~45% of full dose", () => {
		// dose=400g → starts at 100 g/ha = COPPER_FULL_DOSE.
		// After 25mm (k=ln(2)/25 → ×0.5) + 1 day (k=ln(2)/7 → ×0.906): ≈ 45 g/ha → 45%
		const parcel = makeParcel({
			treatmentDate: new Date("2025-06-19T12:00:00Z"), // 1 day ago
			weatherHistories: [
				{
					dateTime: new Date("2025-06-20T12:00:00Z"),
					cumulativePrecipitation: 25,
				},
			],
		});
		const result = calculateCoverageData([parcel], compositions, colorMap, []);
		const sub = result.substances[0];
		expect(sub.coveragePercent).toBeLessThan(55);
		expect(sub.coveragePercent).toBeGreaterThan(35);
	});

	test("sulfur: 2.5mm rain reduces coverage to ~45% of full dose", () => {
		// dose=8000g product at 80% composition, 10 000m² → 8000*0.8*10000/10000 = 6400 g/ha = SULFUR_FULL_DOSE.
		// After 2.5mm (k=ln(2)/2.5 → ×0.5) + 1 day (k=ln(2)/7 → ×0.906): ≈ 2899 g/ha → 45%
		const parcel = makeParcel({
			productId: "product-sulfur",
			substanceId: "substance-sulfur",
			dose: 8_000,
			compositionDose: 80,
			treatmentDate: new Date("2025-06-19T12:00:00Z"),
			weatherHistories: [
				{
					dateTime: new Date("2025-06-20T12:00:00Z"),
					cumulativePrecipitation: 2.5,
				},
			],
		});
		const result = calculateCoverageData([parcel], compositions, colorMap, []);
		const sub = result.substances[0];
		expect(sub.coveragePercent).toBeLessThan(55);
		expect(sub.coveragePercent).toBeGreaterThan(35);
	});

	test("top-up treatment after rain: T1 and T2 see independent rain histories", () => {
		// Scenario: T1 applied Sunday (day -4), 10mm rain on Thursday (day 0 = FIXED_NOW).
		// T2 applied Thursday (day 0) at exactly the deficit dose to restore full coverage.
		// Friday 5mm rain hits: T1 sees 15mm total, T2 sees only 5mm.
		const sunday = new Date("2025-06-16T12:00:00Z"); // 4 days before FIXED_NOW
		const thursday = FIXED_NOW; // same as FIXED_NOW (day 0, days=0)

		// 10 000m² parcel, T1 dose = 400g product (25%) → 100 g/ha initial
		const kRainCopper = Math.LN2 / 25;
		const kTime7 = Math.LN2 / 7;

		// Expected T1 remaining after 10mm rain and 4 days:
		const t1Remaining =
			100 * Math.exp(-kRainCopper * 10) * Math.exp(-kTime7 * 4);
		// T2 dose restores the deficit exactly:
		const t2Initial = 100 - t1Remaining;

		const parcel = {
			id: "parcel-1",
			name: "Parcel parcel-1",
			width: 100,
			height: 100,
			latitude: 45,
			longitude: 7,
			weatherHistories: [
				// Thursday rain — after T1 (Sunday) but on the same instant as T2,
				// so sumRainAfterDate(thursday) = 0 for T2 (strict >)
				{
					dateTime: new Date("2025-06-20T12:00:00Z"),
					cumulativePrecipitation: 10,
				},
			],
			treatments: [
				{
					id: "t1",
					appliedDate: sunday,
					productApplications: [
						{
							dose: 400,
							product: {
								id: "product-copper",
								daysBetweenApplications: 7,
								composition: [{ dose: 25, substanceId: "substance-copper" }],
							},
						},
					],
				},
				{
					id: "t2",
					appliedDate: thursday,
					productApplications: [
						{
							// Dose in grams of product needed to supply t2Initial g/ha active
							dose: (t2Initial / 0.25) * (10000 / 10000), // × (areaM2/10000) cancels for 1ha
							product: {
								id: "product-copper",
								daysBetweenApplications: 7,
								composition: [{ dose: 25, substanceId: "substance-copper" }],
							},
						},
					],
				},
			],
		};

		const result = calculateCoverageData([parcel], compositions, colorMap, []);
		const sub = result.substances[0];

		// Right after the top-up: T1 remaining + T2 initial = 100 g/ha = COPPER_FULL_DOSE.
		// coveragePercent = 100/100 = 100% — the scientific anchor correctly shows full protection,
		// even though total applied (T1 initial + T2 initial) > 100 g/ha.
		expect(sub.weightedRemainingGPerHa).toBeCloseTo(100, 1);
		expect(sub.coveragePercent).toBeCloseTo(100, 1);
		// Total applied is > 100 because T2 was a partial top-up dose on top of T1
		expect(sub.weightedInitialGPerHa).toBeGreaterThan(100);

		// Now simulate Friday: add 5mm rain after Thursday (strictly > thursday timestamp)
		const parcelWithFriday = {
			...parcel,
			weatherHistories: [
				{
					dateTime: new Date("2025-06-20T12:00:00Z"),
					cumulativePrecipitation: 10,
				}, // Thursday
				{
					dateTime: new Date("2025-06-21T12:00:00Z"),
					cumulativePrecipitation: 5,
				}, // Friday
			],
		};
		vi.setSystemTime(new Date("2025-06-21T12:00:00Z")); // advance to Friday

		const resultFriday = calculateCoverageData(
			[parcelWithFriday],
			compositions,
			colorMap,
			[],
		);
		const subFriday = resultFriday.substances[0];

		// T1 (Sunday): 15mm total rain, 5 days
		const t1Friday = 100 * Math.exp(-kRainCopper * 15) * Math.exp(-kTime7 * 5);
		// T2 (Thursday): 5mm rain (only Friday), 1 day
		const t2Friday =
			t2Initial * Math.exp(-kRainCopper * 5) * Math.exp(-kTime7 * 1);
		const expectedTotal = t1Friday + t2Friday;

		expect(subFriday.weightedRemainingGPerHa).toBeCloseTo(expectedTotal, 1);

		// T1 should have lost more than T2 (T1 saw 15mm, T2 saw 5mm)
		expect(t1Friday / 100).toBeLessThan(t2Friday / t2Initial);
	});

	test("two treatments on same parcel stack additively", () => {
		// Each treatment: 200g × 25% × 10000/10000 = 50 g/ha active.
		// Two treatments: 50 + 50 = 100 g/ha = COPPER_FULL_DOSE → 100% coverage.
		const parcel = {
			...makeParcel({ treatmentDate: FIXED_NOW, weatherHistories: [] }),
			treatments: [
				{
					id: "t-1",
					appliedDate: FIXED_NOW,
					productApplications: [
						{
							dose: 200,
							product: {
								id: "product-copper",
								daysBetweenApplications: 7,
								composition: [{ dose: 25, substanceId: "substance-copper" }],
							},
						},
					],
				},
				{
					id: "t-2",
					appliedDate: FIXED_NOW,
					productApplications: [
						{
							dose: 200,
							product: {
								id: "product-copper",
								daysBetweenApplications: 7,
								composition: [{ dose: 25, substanceId: "substance-copper" }],
							},
						},
					],
				},
			],
		};
		const result = calculateCoverageData([parcel], compositions, colorMap, []);
		const sub = result.substances[0];
		expect(sub.weightedInitialGPerHa).toBeCloseTo(100, 1); // 50 + 50
		expect(sub.coveragePercent).toBeCloseTo(100, 1);
	});

	test("copper has leafSurfaceMgPerM2; sulfur does not", () => {
		const copperParcel = makeParcel({});
		const result = calculateCoverageData(
			[copperParcel],
			compositions,
			colorMap,
			[],
		);
		expect(result.substances[0].leafSurfaceMgPerM2).toBeDefined();

		const sulfurParcel = makeParcel({
			productId: "product-sulfur",
			substanceId: "substance-sulfur",
		});
		const result2 = calculateCoverageData(
			[sulfurParcel],
			compositions,
			colorMap,
			[],
		);
		expect(result2.substances[0].leafSurfaceMgPerM2).toBeUndefined();
	});

	test("forecast projects decay from today's remaining value", () => {
		const parcel = makeParcel({ dose: 100, treatmentDate: FIXED_NOW });
		const forecastDays = [
			{
				date: new Date("2025-06-21"),
				cumulativePrecipitation: 0,
			},
			{
				date: new Date("2025-06-22"),
				cumulativePrecipitation: 10,
			},
		];
		const result = calculateCoverageData(
			[parcel],
			compositions,
			colorMap,
			forecastDays,
		);
		const sub = result.substances[0];
		expect(sub.forecast).toHaveLength(2);
		// With 10mm copper rain → significant drop on day 2
		expect(sub.forecast[1].projectedWeightedRemainingGPerHa).toBeLessThan(
			sub.forecast[0].projectedWeightedRemainingGPerHa,
		);
	});

	test("area-weighted average: bigger parcel has more influence", () => {
		const bigParcel = makeParcel({
			id: "big",
			width: 200,
			height: 100, // 20 000 m²
			dose: 100, // g product, 25% → 25 g/ha initial
			treatmentDate: FIXED_NOW,
		});
		const smallParcel = makeParcel({
			id: "small",
			width: 50,
			height: 100, // 5 000 m²
			dose: 400, // g product, 25% → 200 g/ha initial (high dose, small field)
			treatmentDate: FIXED_NOW,
		});
		const result = calculateCoverageData(
			[bigParcel, smallParcel],
			compositions,
			colorMap,
			[],
		);
		const sub = result.substances[0];
		// Big: 100g * 25% * (10000/20000) = 12.5 g/ha
		// Small: 400g * 25% * (10000/5000) = 200 g/ha
		// Area-weighted: (12.5*20000 + 200*5000) / 25000 = 50 g/ha
		// (simple average would be 106 g/ha — area-weighting pulls toward big parcel)
		expect(sub.weightedInitialGPerHa).toBeCloseTo(50, 1);
	});

	test("hasWeatherData = false when parcel has no weather histories", () => {
		const parcel = makeParcel({ weatherHistories: [] });
		const result = calculateCoverageData([parcel], compositions, colorMap, []);
		expect(result.hasWeatherData).toBe(false);
	});

	test("hasIncompleteWeatherHistory = true when treatment predates earliest record", () => {
		const treatmentDate = new Date("2025-05-01");
		const parcel = makeParcel({
			treatmentDate,
			weatherHistories: [
				{ dateTime: new Date("2025-06-01"), cumulativePrecipitation: 0 },
			],
		});
		const result = calculateCoverageData([parcel], compositions, colorMap, []);
		expect(result.hasIncompleteWeatherHistory).toBe(true);
	});
});
