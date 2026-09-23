import { ProductDoseUnit, type Product } from "@prisma/client";
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

/**
 * Validates each application against its product (must exist, unit must match)
 * and converts the entered dose to grams.
 */
export function productApplicationsToGrams(
	applications: {
		productId: string;
		dose: number;
		doseUnit: ProductDoseUnit;
	}[],
	products: Pick<
		Product,
		"id" | "doseUnit" | "productLiterToKiloGramConversionRate"
	>[],
): { productId: string; doseInGrams: number }[] {
	const productById = new Map(products.map((p) => [p.id, p]));
	return applications.map((app) => {
		const product = productById.get(app.productId);
		if (!product || product.doseUnit !== app.doseUnit) {
			throw new Error(Errors.RESOURCE_NOT_FOUND);
		}
		return {
			productId: app.productId,
			doseInGrams: productDoseEntryToGrams(app.dose, product),
		};
	});
}
