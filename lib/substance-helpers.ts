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
			treatment.productApplications.forEach((app) => {
				app.product.composition.forEach((comp) => {
					const substanceName = comp.substance.name;
					const totalDose = (app.dose * comp.dose) / 1000; // Convert to kg

					if (!acc[substanceName]) {
						acc[substanceName] = {
							name: substanceName,
							totalUsed: 0,
							maxDosage: comp.substance.maxDosage,
							monthlyData: Array(12).fill(0),
							applications: [],
						};
					}

					acc[substanceName].totalUsed += totalDose;

					if (treatment.appliedDate) {
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
