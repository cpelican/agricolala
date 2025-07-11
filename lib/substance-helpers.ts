import { type SubstanceData } from "@/components/types";

const HECTARE_IN_METERS = 10_000;
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

type SubstanceName =
	TreatmentWithProducts["productApplications"][number]["product"]["composition"][number]["substance"]["name"];

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
		{} as Record<SubstanceName, SubstanceData>,
	);

	return Object.values(substanceDataMap);
}
