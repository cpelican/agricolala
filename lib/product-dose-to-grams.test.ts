import { ProductDoseUnit } from "@prisma/client";
import { describe, expect, test } from "vitest";
import { productDoseEntryToGrams } from "./product-dose-to-grams";

describe("productDoseEntryToGrams", () => {
	test("grams pass through", () => {
		expect(
			productDoseEntryToGrams(20, {
				doseUnit: ProductDoseUnit.GRAM,
				productLiterToKiloGramConversionRate: null,
			}),
		).toBe(20);
	});

	test("milliliters multiply by conversion rate on product", () => {
		expect(
			productDoseEntryToGrams(100, {
				doseUnit: ProductDoseUnit.MILLILITER,
				productLiterToKiloGramConversionRate: 1,
			}),
		).toBe(100);
		expect(
			productDoseEntryToGrams(2, {
				doseUnit: ProductDoseUnit.MILLILITER,
				productLiterToKiloGramConversionRate: 0.9,
			}),
		).toBe(1.8);
	});

	test("missing or zero rate throws", () => {
		expect(() =>
			productDoseEntryToGrams(10, {
				doseUnit: ProductDoseUnit.MILLILITER,
				productLiterToKiloGramConversionRate: null,
			}),
		).toThrow();
		expect(() =>
			productDoseEntryToGrams(10, {
				doseUnit: ProductDoseUnit.MILLILITER,
				productLiterToKiloGramConversionRate: 0,
			}),
		).toThrow();
	});
});
