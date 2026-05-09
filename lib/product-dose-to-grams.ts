import { ProductDoseUnit } from "@prisma/client";
import { Errors } from "./constants";

export function productDoseEntryToGrams(
	dose: number,
	product: {
		doseUnit: ProductDoseUnit;
		productLiterToKiloGramConversionRate: number | null;
	},
): number {
	if (product.doseUnit === ProductDoseUnit.GRAM) {
		return dose;
	}
	const rate = product.productLiterToKiloGramConversionRate;
	if (typeof rate !== "number" || rate <= 0) {
		console.error(
			"Missing or invalid productLiterToKiloGramConversionRate for liquid product",
			product,
		);
		throw new Error(Errors.RESOURCE_NOT_FOUND);
	}
	return dose * rate;
}
