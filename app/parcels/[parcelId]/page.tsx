import { notFound } from "next/navigation";
import { AuthGuard } from "@/components/auth-guard";
import { BottomNavigation } from "@/components/bottom-navigation";
import { LayoutWithHeader } from "@/components/layout-with-header";
import { ParcelDetail } from "@/components/parcel-detail";
import { getCachedDiseases, getCachedProducts } from "@/lib/cached-data";
import { calculateSubstanceData } from "@/lib/substance-helpers";
import { prisma } from "@/lib/prisma";

export type PageProps<T extends Record<string, string>> = {
	params: Promise<T>;
	searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ParcelPage({
	params,
}: PageProps<{ parcelId: string }>) {
	const { parcelId } = await params;
	const [parcel, diseases, products] = await Promise.all([
		prisma.parcel.findUnique({
			where: { id: parcelId },
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

	// Calculate substance usage data using helper
	const treatmentsWithParcelName = currentYearTreatments.map((treatment) => ({
		...treatment,
		parcelId: parcel.name,
	}));
	const substanceData = calculateSubstanceData(treatmentsWithParcelName);

	// Split treatments into upcoming and past
	const now = new Date();
	const upcomingTreatments = currentYearTreatments.filter(
		(t) => !t.appliedDate || new Date(t.appliedDate) > now,
	);
	const pastTreatments = currentYearTreatments.filter(
		(t) => t.appliedDate && new Date(t.appliedDate) <= now,
	);

	return (
		<AuthGuard>
			<LayoutWithHeader
				title={`${parcel.name}`}
				subtitle={`${parcel.type} - ${parcel.width}m x ${parcel.height}m`}
			>
				<ParcelDetail
					parcel={parcel}
					diseases={diseases}
					products={products}
					upcomingTreatments={upcomingTreatments}
					pastTreatments={pastTreatments}
					substanceData={substanceData}
				/>
				<BottomNavigation />
			</LayoutWithHeader>
		</AuthGuard>
	);
}
