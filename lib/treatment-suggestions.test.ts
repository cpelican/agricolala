import { PhenologicalStage } from "@prisma/client";
import { describe, test, expect } from "vitest";
import { DEFAULT_DAYS_BETWEEN_APPLICATIONS } from "./coverage-helpers";
import { getStageSensitivityRows } from "./disease-stage-sensitivity";
import {
	CRITICAL_SUGGESTION_WINDOW_DAYS,
	buildTreatmentSuggestion,
	isCriticalCadence,
	isProductAllowedAtStage,
} from "./treatment-suggestions";

const sensitivities = [
	...getStageSensitivityRows("Peronospora").map((row) => ({
		...row,
		diseaseId: "peronospora",
	})),
	...getStageSensitivityRows("Oidium").map((row) => ({
		...row,
		diseaseId: "oidium",
	})),
];
const TODAY = new Date(2026, 5, 15);

function daysAgo(days: number): Date {
	return new Date(
		TODAY.getFullYear(),
		TODAY.getMonth(),
		TODAY.getDate() - days,
	);
}

function product(
	id: string,
	daysBetweenApplications: number | null,
	restrictedAtFlowering = false,
) {
	return {
		id,
		daysBetweenApplications,
		composition: [{ substance: { restrictedAtFlowering } }],
	};
}

// Last treatment with copper (7 days, downy mildew) and sulfur (8 days, powdery mildew).
function lastTreatment(
	appliedDaysAgo: number,
	products = [product("copper", 7), product("sulfur", 8)],
) {
	return {
		id: "treatment",
		appliedDate: daysAgo(appliedDaysAgo),
		waterDose: 10,
		diseaseIds: ["peronospora", "oidium"],
		productApplications: products.map((p) => ({ dose: 5, product: p })),
	};
}

const productIdsByDiseaseId = {
	peronospora: new Set(["copper", "orangeOil"]),
	oidium: new Set(["sulfur", "orangeOil"]),
};

function suggest(
	treatment: ReturnType<typeof lastTreatment>,
	stage: PhenologicalStage | null,
	activeDiseaseIds = new Set(["peronospora", "oidium"]),
) {
	return buildTreatmentSuggestion({
		lastTreatment: treatment,
		date: TODAY,
		stage,
		activeDiseaseIds,
		productIdsByDiseaseId,
		sensitivities,
	});
}

describe("isProductAllowedAtStage", () => {
	test("restricted products are left out only at flowering", () => {
		const restricted = product("copper", 7, true);
		expect(
			isProductAllowedAtStage(restricted, PhenologicalStage.FLOWERING),
		).toBe(false);
		expect(
			isProductAllowedAtStage(restricted, PhenologicalStage.FRUIT_SET),
		).toBe(true);
		expect(isProductAllowedAtStage(restricted, null)).toBe(true);
		expect(
			isProductAllowedAtStage(
				product("sulfur", 8),
				PhenologicalStage.FLOWERING,
			),
		).toBe(true);
	});

	test("a mix is restricted when one of its substances is", () => {
		const mix = {
			composition: [
				{ substance: { restrictedAtFlowering: true } },
				{ substance: { restrictedAtFlowering: false } },
			],
		};
		expect(isProductAllowedAtStage(mix, PhenologicalStage.FLOWERING)).toBe(
			false,
		);
	});
});

describe("isCriticalCadence", () => {
	test.each([
		[PhenologicalStage.LEAVES_UNFOLDING, false],
		// The stage before flowering, so the last spray lands before bloom.
		[PhenologicalStage.FLOWER_CLUSTERS, true],
		[PhenologicalStage.FLOWERING, true],
		[PhenologicalStage.FRUIT_SET, true],
		[PhenologicalStage.BUNCH_CLOSURE, false],
	])("%s → %s", (stage, expected) => {
		expect(isCriticalCadence(["peronospora"], stage, sensitivities)).toBe(
			expected,
		);
	});

	test("not without a stage", () => {
		expect(isCriticalCadence(["peronospora"], null, sensitivities)).toBe(false);
	});
});

describe("buildTreatmentSuggestion", () => {
	test("regular cadence: each product once its own interval has elapsed", () => {
		const suggestion = suggest(
			lastTreatment(7),
			PhenologicalStage.BUNCH_CLOSURE,
		);
		expect(suggestion?.productApplications.map((p) => p.productId)).toEqual([
			"copper",
		]);
		expect(suggestion?.isCritical).toBe(false);
		expect(suggestion?.dateMin).toEqual(TODAY);
		expect(suggestion?.dateMax).toEqual(
			new Date(TODAY.getFullYear(), TODAY.getMonth(), TODAY.getDate() + 7),
		);
	});

	test("critical cadence: every product at the shortest interval, short window", () => {
		const suggestion = suggest(lastTreatment(7), PhenologicalStage.FLOWERING);
		expect(suggestion?.productApplications.map((p) => p.productId)).toEqual([
			"copper",
			"sulfur",
		]);
		expect(suggestion?.isCritical).toBe(true);
		expect(suggestion?.dateMin).toEqual(TODAY);
		expect(suggestion?.dateMax).toEqual(
			new Date(
				TODAY.getFullYear(),
				TODAY.getMonth(),
				TODAY.getDate() + CRITICAL_SUGGESTION_WINDOW_DAYS,
			),
		);
	});

	test("nothing before the shortest interval, even when critical", () => {
		expect(suggest(lastTreatment(6), PhenologicalStage.FLOWERING)).toBeNull();
	});

	test("only products for diseases still active", () => {
		const suggestion = suggest(
			lastTreatment(10),
			PhenologicalStage.BUNCH_CLOSURE,
			new Set(["oidium"]),
		);
		expect(suggestion?.productApplications.map((p) => p.productId)).toEqual([
			"sulfur",
		]);
		expect(suggestion?.diseaseIds).toEqual(["oidium"]);
	});

	test("no suggestion when no disease is active", () => {
		expect(
			suggest(lastTreatment(10), PhenologicalStage.VERAISON, new Set()),
		).toBeNull();
	});

	test("restricted products are not suggested at flowering", () => {
		const treatment = lastTreatment(10, [
			product("copper", 7, true),
			product("sulfur", 8),
		]);
		expect(
			suggest(treatment, PhenologicalStage.FLOWERING)?.productApplications.map(
				(p) => p.productId,
			),
		).toEqual(["sulfur"]);
		expect(
			suggest(treatment, PhenologicalStage.FRUIT_SET)?.productApplications.map(
				(p) => p.productId,
			),
		).toEqual(["copper", "sulfur"]);
	});

	test("products without a label interval use the default one", () => {
		const treatment = lastTreatment(DEFAULT_DAYS_BETWEEN_APPLICATIONS - 1, [
			product("copper", null),
		]);
		expect(suggest(treatment, null)).toBeNull();
	});
});
