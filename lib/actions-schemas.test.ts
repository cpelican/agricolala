import { describe, test, expect } from "vitest";
import { createTreatmentSchema } from "./actions-schemas";

const treatmentBase = {
	appliedDate: new Date(),
	parcelIds: ["parcel-1"],
	waterDose: 10,
	productApplications: [{ productId: "product-1", dose: 1 }],
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
