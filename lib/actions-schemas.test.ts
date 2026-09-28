import { PhenologicalStage, ProductDoseUnit } from "@prisma/client";
import { describe, test, expect } from "vitest";
import {
	createTreatmentSchema,
	recordPhenologyObservationSchema,
} from "./actions-schemas";

const treatmentBase = {
	appliedDate: new Date(),
	parcelIds: ["parcel-1"],
	waterDose: 10,
	productApplications: [
		{ productId: "product-1", dose: 1, doseUnit: ProductDoseUnit.GRAM },
	],
};

describe("createTreatmentSchema diseases", () => {
	test("strips empty rows and keeps filled diseases", () => {
		const result = createTreatmentSchema.parse({
			...treatmentBase,
			diseases: [{ diseaseId: "peronospora" }, { diseaseId: "" }],
		});
		expect(result.diseases).toEqual([{ diseaseId: "peronospora" }]);
	});

	test("deduplicates disease ids", () => {
		const result = createTreatmentSchema.parse({
			...treatmentBase,
			diseases: [{ diseaseId: "oidium" }, { diseaseId: "oidium" }],
		});
		expect(result.diseases).toEqual([{ diseaseId: "oidium" }]);
	});

	test("rejects when no disease remains after stripping empties", () => {
		expect(() =>
			createTreatmentSchema.parse({
				...treatmentBase,
				diseases: [{ diseaseId: "" }],
			}),
		).toThrow();
	});

	test("trims disease ids and treats whitespace-only as empty", () => {
		const result = createTreatmentSchema.parse({
			...treatmentBase,
			diseases: [
				{ diseaseId: "  peronospora  " },
				{ diseaseId: "   " },
				{ diseaseId: "peronospora" },
			],
		});
		expect(result.diseases).toEqual([{ diseaseId: "peronospora" }]);
	});
});

describe("createTreatmentSchema phenologicalStage", () => {
	const withDisease = {
		...treatmentBase,
		diseases: [{ diseaseId: "peronospora" }],
	};

	test("is optional", () => {
		const result = createTreatmentSchema.parse(withDisease);
		expect(result.phenologicalStage).toBeUndefined();
	});

	test("accepts a known stage", () => {
		const result = createTreatmentSchema.parse({
			...withDisease,
			phenologicalStage: PhenologicalStage.FLOWERING,
		});
		expect(result.phenologicalStage).toBe(PhenologicalStage.FLOWERING);
	});

	test("rejects an unknown stage", () => {
		expect(() =>
			createTreatmentSchema.parse({
				...withDisease,
				phenologicalStage: "BLOSSOM",
			}),
		).toThrow();
	});
});

describe("recordPhenologyObservationSchema", () => {
	test("parses an ISO date string", () => {
		const result = recordPhenologyObservationSchema.parse({
			parcelId: "parcel-1",
			stage: PhenologicalStage.BUD_BREAK,
			observedAt: "2026-04-10T00:00:00.000Z",
		});
		expect(result.observedAt).toEqual(new Date("2026-04-10T00:00:00.000Z"));
	});

	test("defaults observedAt to now", () => {
		const before = Date.now();
		const result = recordPhenologyObservationSchema.parse({
			parcelId: "parcel-1",
			stage: PhenologicalStage.BUD_BREAK,
		});
		expect(result.observedAt.getTime()).toBeGreaterThanOrEqual(before);
	});

	test("requires a parcel and a known stage", () => {
		expect(() =>
			recordPhenologyObservationSchema.parse({
				parcelId: "",
				stage: PhenologicalStage.BUD_BREAK,
			}),
		).toThrow();
		expect(() =>
			recordPhenologyObservationSchema.parse({
				parcelId: "parcel-1",
				stage: "BLOSSOM",
			}),
		).toThrow();
	});
});
