import { Suspense } from "react";
import { notFound } from "next/navigation";
import { AuthGuard } from "@/components/auth-guard";
import { LayoutWithHeader } from "@/components/layout-with-header";
import { BottomNavigation } from "@/components/bottom-navigation";
import { calculateSubstanceData } from "@/lib/substance-helpers";
import { requireAuth } from "@/lib/auth-utils";
import { ParcelMapWrapper } from "@/components/parcel-map-wrapper";
import { getParcelDetail, type ParcelDetailType } from "@/lib/parcel-helpers";
import { ParcelDetail } from "@/components/parcel-detail";

export type PageProps<T extends Record<string, string>> = {
	params: Promise<T>;
	searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ParcelPage({
	params,
}: PageProps<{ parcelId: string }>) {
	const { parcelId } = await params;
	const session = await requireAuth();
	let parcel: ParcelDetailType;
	try {
		parcel = await getParcelDetail(parcelId, session.user.id);
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
	} catch (e) {
		notFound();
	}

	const currentYear = new Date().getFullYear();
	const currentYearTreatments = parcel.treatments.filter((treatment) => {
		if (!treatment.appliedDate) return false;
		return new Date(treatment.appliedDate).getFullYear() === currentYear;
	});

	const treatmentsWithParcelName = currentYearTreatments.map((treatment) => ({
		...treatment,
		parcelId: parcel.name,
	}));
	const substanceData = calculateSubstanceData(treatmentsWithParcelName);

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
				<div className="space-y-6">
					<Suspense
						fallback={
							<div className="animate-pulse h-32 bg-gray-200 rounded"></div>
						}
					>
						<ParcelDetail
							parcel={parcel}
							upcomingTreatments={upcomingTreatments}
							pastTreatments={pastTreatments}
							substanceData={substanceData}
						/>
					</Suspense>

					<div className="h-64">
						<Suspense
							fallback={
								<div className="animate-pulse h-64 bg-gray-200 rounded"></div>
							}
						>
							<ParcelMapWrapper
								parcels={[parcel]}
								highlightParcelId={parcel.id}
							/>
						</Suspense>
					</div>
				</div>
				<BottomNavigation />
			</LayoutWithHeader>
		</AuthGuard>
	);
}
