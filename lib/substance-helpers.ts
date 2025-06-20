import { type SubstanceData } from "@/components/types";

interface TreatmentWithProducts {
	id: string;
	appliedDate: Date | null;
	parcelId?: string;
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
					const totalDose = application.dose * (composition.dose / 100) * 1_000; // Convert to kg

					if (!acc[substanceName]) {
						acc[substanceName] = {
							name: substanceName,
							totalUsed: 0,
							// kg / ha / year -> https://www.ccpb.it/blog/2019/04/03/rame-agricoltura-biologica/
							maxDosage: composition.substance.maxDosage,
							monthlyData: Array(12).fill(0),
							applications: [],
						};
					}

					if (treatment.appliedDate) {
						acc[substanceName].totalUsed += totalDose;
						const month = new Date(treatment.appliedDate).getMonth();
						acc[substanceName].monthlyData[month] += totalDose;
						acc[substanceName].applications.push({
							date: treatment.appliedDate,
							dose: totalDose,
							parcel: treatment.parcelId || "Unknown",
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
