import { notFound } from "next/navigation";
import { ParcelDetail } from "@/components/parcel-detail";
import { type SubstanceData } from "@/components/types";
import { getCachedDiseases, getCachedProducts } from "@/lib/cached-data";
import { prisma } from "@/lib/prisma";

interface ParcelPageProps {
	params: {
		parcelId: string;
	};
}

export default async function ParcelPage({ params }: ParcelPageProps) {
	const [parcel, diseases, products] = await Promise.all([
		prisma.parcel.findUnique({
			where: { id: params.parcelId },
			include: {
				treatments: {
					include: {
						productApplications: {
							include: {
								product: {
									include: {
										composition: {
											include: {
												substance: true,
											},
										},
									},
								},
							},
						},
						parcel: true,
					},
					orderBy: {
						appliedDate: "desc",
					},
				},
			},
		}),
		getCachedDiseases(),
		getCachedProducts(),
	]);

	if (!parcel) {
		notFound();
	}

	// Get current year's treatments
	const currentYear = new Date().getFullYear();
	const currentYearTreatments = parcel.treatments.filter((treatment) => {
		if (!treatment.appliedDate) return false;
		return new Date(treatment.appliedDate).getFullYear() === currentYear;
	});

	// Calculate substance usage data
	const substanceData = currentYearTreatments.reduce(
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
							parcel: treatment.parcelId,
						});
					}
				});
			});
			return acc;
		},
		{} as Record<string, SubstanceData>,
	);

	// Split treatments into upcoming and past
	const now = new Date();
	const upcomingTreatments = currentYearTreatments.filter(
		(t) => !t.appliedDate || new Date(t.appliedDate) > now,
	);
	const pastTreatments = currentYearTreatments.filter(
		(t) => t.appliedDate && new Date(t.appliedDate) <= now,
	);

	return (
		<ParcelDetail
			parcel={parcel}
			diseases={diseases}
			products={products}
			upcomingTreatments={upcomingTreatments}
			pastTreatments={pastTreatments}
			substanceData={Object.values(substanceData)}
		/>
	);
}
