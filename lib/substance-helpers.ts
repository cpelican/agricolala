import { type SubstanceData } from "@/components/types";
import {
	type Product,
	type Substance,
	type SubstanceDose,
} from "@prisma/client";
import { type ParcelWithTreatments } from "./data-fetcher";

const HECTARE_IN_METERS = 10_000;
const KG_IN_GR = 1_000;

interface TreatmentWithProducts {
	id: string;
	appliedDate: Date | null;
	parcelName?: string;
	parcel: {
		width: number;
		height: number;
	};
	productApplications: Array<{
		dose: number;
		product: {
			composition: Array<{
				dose: number;
				substance: {
					name: string;
					maxDosage: number;
				};
			}>;
		};
	}>;
}

export function calculateSubstanceData(
	treatments: TreatmentWithProducts[],
): SubstanceData[] {
	const substanceDataMap = treatments.reduce(
		(acc, treatment) => {
			treatment.productApplications.forEach((application) => {
				application.product.composition.forEach((composition) => {
					const substanceName = composition.substance.name;
					// application dose (gr of product applied during the treatment)
					// composition dose (% of active substance present in the product used in the treatemnt)
					const doseOfPureActiveSubstance =
						application.dose * (composition.dose / 100); // in grams
					const parcelSize = treatment.parcel.width * treatment.parcel.height; // in square meters
					const doseOfPureActiveSubstancePerHa =
						(doseOfPureActiveSubstance * HECTARE_IN_METERS) / parcelSize; // in kg per hectare

					if (!acc[substanceName]) {
						acc[substanceName] = {
							name: substanceName,
							totalDoseOfProduct: 0,
							totalUsedOfPureActiveSubstance: 0,
							totalUsedOfPureActiveSubstancePerHa: 0,
							// kg / ha / year -> https://www.ccpb.it/blog/2019/04/03/rame-agricoltura-biologica/
							maxDosage: composition.substance.maxDosage,
							monthlyData: Array(12).fill(0),
							applications: [],
						};
					}

					if (treatment.appliedDate) {
						acc[substanceName].totalDoseOfProduct += application.dose;
						acc[substanceName].totalUsedOfPureActiveSubstance +=
							doseOfPureActiveSubstance;
						acc[substanceName].totalUsedOfPureActiveSubstancePerHa +=
							doseOfPureActiveSubstancePerHa;
						const month = new Date(treatment.appliedDate).getMonth();
						acc[substanceName].monthlyData[month] += doseOfPureActiveSubstance; //gr
						acc[substanceName].applications.push({
							date: treatment.appliedDate,
							dose: application.dose, // gr
							parcel: treatment.parcelName || "Unknown",
						});
					}
				});
			});
			return acc;
		},
		{} as Record<string, SubstanceData>,
	);

	return Object.values(substanceDataMap);
}

export function calculateAdvisedDosePerProduct(
	parcelIds: string[],
	substanceDoses: Pick<
		SubstanceDose,
		"id" | "dose" | "productId" | "substanceId"
	>[],
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

	const productSubstanceDoses = substanceDoses.reduce<
		Array<
			Pick<SubstanceDose, "id" | "dose" | "productId" | "substanceId"> &
				Pick<Product, "id" | "name" | "maxApplications"> &
				Pick<Substance, "id" | "maxDosage" | "name">
		>
	>((acc, sd) => {
		const substance = substances.find((s) => s.id === sd.substanceId);
		if (!substance) {
			return acc;
		}
		if (sd.productId in productIdsToProduct) {
			acc.push({ ...sd, ...productIdsToProduct[sd.productId], ...substance });
		}
		return acc;
	}, []);

	return productSubstanceDoses.reduce<Record<string, number>>((acc, s) => {
		if (!s.maxApplications) {
			return acc;
		}

		if (!s.maxDosage) {
			return acc;
		}

		const advisedDoseForProductInGr =
			(s.maxDosage / s.maxApplications) * totalAreaHa * KG_IN_GR;
		if (advisedDoseForProductInGr > 0) {
			acc[s.productId] = advisedDoseForProductInGr;
		}

		return acc;
	}, {});
}
