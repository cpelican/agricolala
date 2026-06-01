import { type SubstanceData } from "@/components/types";
import { type Product, type Substance } from "@prisma/client";
import {
	type getCachedCompositions,
	type ParcelWithTreatments,
} from "./data-fetcher";
import { GRAMS_PER_KILOGRAM } from "./constants";

const HECTARE_IN_METERS = 10_000;

interface TreatmentWithProducts {
	id: string;
	appliedDate: Date | null;
	parcelId: string;
	parcelName?: string;
	parcel: {
		width: number;
		height: number;
	};
	productApplications: Array<{
		dose: number;
		product: {
			id: string;
			composition: Array<{
				dose: number;
				substanceId: string;
			}>;
		};
	}>;
}

interface SubstanceAccumulator {
	name: string;
	applicationCount: number;
	totalDoseOfProduct: number;
	totalUsedOfPureActiveSubstance: number;
	maxDosage: number;
	monthlyData: number[];
	parcelAreas: Map<string, number>;
}

/**
 * Aggregates pure active substance usage from treatments and computes totals
 * plus a surface-weighted rate per hectare.
 *
 * ## Per-hectare rate (surface-weighted)
 *
 * Regulatory limits (e.g. copper {@link Substance.maxDosage} in kg/ha/year) express
 * how much pure active substance was applied relative to **cultivated area where
 * it was used**. This function computes:
 *
 * ```
 * totalUsedOfPureActiveSubstancePerHaGrams =
 *   (totalPureActiveSubstanceGr × 10_000) / sum(uniqueParcelAreasM2)
 * ```
 *
 * All grams applied in the scope are summed; the denominator is the total m² of
 * distinct parcels that received this substance (each `parcelId` counted once).
 * That value is scaled to one hectare (10_000 m²).
 *
 * ## Why surface-weighted fits this app
 *
 * - **Matches the limit semantics**: `maxDosage` is a single cap per hectare of
 *   treated land for the year, not an average “per parcel” score. One farm-wide
 *   intensity on the combined treated surface is what you compare to that cap.
 * - **Larger parcels count proportionally**: If most copper went on a 300 m² block
 *   and little on a 150 m² block, the result reflects that weighting—closer to
 *   real load on the ground than giving every parcel equal influence regardless
 *   of size.
 * - **Aligns with parcel-level + farm-level views**: Parcel aggregations use the
 *   same formula on one parcel; user-level aggregations extend it by summing
 *   unique treated parcel areas across the farm.
 *
 * ## Denominator (which parcels count)
 *
 * Only parcels that appear in `treatments` with a non-null `appliedDate` and at
 * least one application containing the substance are included. Parcels with no
 * treatment, or treatments without that substance, are excluded—untreated fields
 * do not dilute the per-ha figure.
 *
 * ## Units
 *
 * - `totalUsedOfPureActiveSubstance`: grams (year total)
 * - `totalUsedOfPureActiveSubstancePerHaGrams`: **grams per hectare** (divide by
 *   1_000 for kg/ha when comparing to `maxDosage`)
 * - `monthlyData`: grams of pure active substance per calendar month
 *
 * @param treatments - Applied treatments for the scope (one parcel or whole farm).
 *   Each entry must include `parcelId` and parcel dimensions.
 * @param compositions - Product composition cache (substance % per product).
 * @returns One {@link SubstanceData} row per substance found in the input.
 *
 * @see https://www.ccpb.it/blog/2019/04/03/rame-agricoltura-biologica/
 */
export function calculateSubstanceData(
	treatments: TreatmentWithProducts[],
	compositions: Awaited<ReturnType<typeof getCachedCompositions>>,
): SubstanceData[] {
	const substanceDataMap = treatments.reduce<
		Record<string, SubstanceAccumulator>
	>((acc, treatment) => {
		const parcelSize = treatment.parcel.width * treatment.parcel.height; // in square meters

		treatment.productApplications.forEach((application) => {
			application.product.composition.forEach((composition) => {
				const substance =
					compositions[composition.substanceId][application.product.id]
						?.substance;
				const substanceName = substance.name;
				// application dose (gr of product applied during the treatment)
				// composition dose (% of active substance present in the product used in the treatemnt)
				const doseOfPureActiveSubstance =
					application.dose * (composition.dose / 100); // in grams

				if (!acc[substanceName]) {
					acc[substanceName] = {
						name: substanceName,
						applicationCount: 0,
						totalDoseOfProduct: 0,
						totalUsedOfPureActiveSubstance: 0,
						// kg / ha / year -> https://www.ccpb.it/blog/2019/04/03/rame-agricoltura-biologica/
						maxDosage: substance.maxDosage,
						monthlyData: Array(12).fill(0),
						parcelAreas: new Map(),
					};
				}

				if (treatment.appliedDate) {
					acc[substanceName].totalDoseOfProduct += application.dose;
					acc[substanceName].totalUsedOfPureActiveSubstance +=
						doseOfPureActiveSubstance;
					acc[substanceName].parcelAreas.set(treatment.parcelId, parcelSize);
					const month = new Date(treatment.appliedDate).getMonth();
					acc[substanceName].monthlyData[month] += doseOfPureActiveSubstance; //gr
					acc[substanceName].applicationCount++;
				}
			});
		});
		return acc;
	}, {});

	return Object.values(substanceDataMap).map((entry) => {
		const totalAreaM2 = [...entry.parcelAreas.values()].reduce(
			(sum, area) => sum + area,
			0,
		);
		const totalUsedOfPureActiveSubstancePerHaGrams =
			totalAreaM2 > 0
				? (entry.totalUsedOfPureActiveSubstance * HECTARE_IN_METERS) /
					totalAreaM2
				: 0;

		return {
			name: entry.name,
			applicationCount: entry.applicationCount,
			totalDoseOfProduct: entry.totalDoseOfProduct,
			totalUsedOfPureActiveSubstance: entry.totalUsedOfPureActiveSubstance,
			totalUsedOfPureActiveSubstancePerHaGrams,
			maxDosage: entry.maxDosage,
			monthlyData: entry.monthlyData,
		};
	});
}

export function calculateAdvisedDosePerProduct(
	parcelIds: string[],
	compositions: Awaited<ReturnType<typeof getCachedCompositions>>,
	products: Pick<Product, "id" | "name" | "maxApplications">[],
	substances: Pick<Substance, "id" | "maxDosage" | "name">[],
	parcels: ParcelWithTreatments[],
): Record<string, number> {
	const totalAreaHa = parcels.reduce((total, parcel) => {
		if (parcelIds.includes(parcel.id)) {
			const areaM2 = parcel.width * parcel.height;
			total += areaM2 / HECTARE_IN_METERS;
		}
		return total;
	}, 0);

	if (totalAreaHa === 0) {
		return {};
	}

	const productIdsToProduct = products.reduce<
		Record<string, Pick<Product, "id" | "name" | "maxApplications">>
	>((acc, p) => {
		acc[p.id] = p;
		return acc;
	}, {});

	const substanceBySubstanceId = substances.reduce<
		Record<string, Pick<Substance, "id" | "maxDosage" | "name">>
	>((acc, s) => {
		acc[s.id] = s;
		return acc;
	}, {});

	const productCompositions: Array<{
		id: string;
		maxDosage: number;
		name: string;
		productId: string;
		substanceId: string;
		dose: number;
		maxApplications?: number | null;
	}> = [];

	for (const id in compositions) {
		if (productIdsToProduct[id]) {
			const productSubstances = compositions[id];
			for (const substanceId in productSubstances) {
				const substance = productSubstances[substanceId];
				if (!substance) {
					continue;
				}
				productCompositions.push({
					...substanceBySubstanceId[substanceId],
					...substance,
					...productIdsToProduct[substance.productId],
				});
			}
		}
	}

	return productCompositions.reduce<Record<string, number>>((acc, s) => {
		if (!s.maxApplications) {
			return acc;
		}

		if (!s.maxDosage) {
			return acc;
		}

		const advisedDoseForProductInGr =
			(s.maxDosage / s.maxApplications) * totalAreaHa * GRAMS_PER_KILOGRAM;

		if (advisedDoseForProductInGr > 0) {
			acc[s.productId] = advisedDoseForProductInGr;
		}

		return acc;
	}, {});
}

export function dedupeDiseaseEntries(
	diseases: { diseaseId: string }[],
): { diseaseId: string }[] {
	const seen = new Set<string>();
	const result: { diseaseId: string }[] = [];
	let hasEmptyRow = false;

	for (const entry of diseases) {
		if (!entry.diseaseId) {
			if (!hasEmptyRow) {
				result.push(entry);
				hasEmptyRow = true;
			}
			continue;
		}
		if (seen.has(entry.diseaseId)) {
			continue;
		}
		seen.add(entry.diseaseId);
		result.push(entry);
	}

	if (result.length === 0) {
		return [{ diseaseId: "" }];
	}

	return result;
}

export function getDiseaseIdsForProducts(
	productIds: string[],
	compositions: Awaited<ReturnType<typeof getCachedCompositions>>,
	substances: Array<Pick<Substance, "id"> & { diseaseIds: string[] }>,
): { diseaseId: string }[] {
	const selectedProductIds = productIds.filter(Boolean);
	if (selectedProductIds.length === 0) {
		return [{ diseaseId: "" }];
	}

	const substanceById = substances.reduce<
		Record<string, { diseaseIds: string[] }>
	>((acc, substance) => {
		acc[substance.id] = substance;
		return acc;
	}, {});

	const diseaseIdSet = new Set<string>();
	for (const productId of selectedProductIds) {
		const productComposition = compositions[productId];
		if (!productComposition) {
			continue;
		}
		for (const substanceId of Object.keys(productComposition)) {
			const substance = substanceById[substanceId];
			if (!substance) {
				continue;
			}
			for (const diseaseId of substance.diseaseIds) {
				diseaseIdSet.add(diseaseId);
			}
		}
	}

	if (diseaseIdSet.size === 0) {
		return [{ diseaseId: "" }];
	}

	return Array.from(diseaseIdSet).map((diseaseId) => ({ diseaseId }));
}
