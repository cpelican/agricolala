import { Suspense } from "react";
import { notFound } from "next/navigation";
import { Map } from "lucide-react";
import { AuthGuard } from "@/components/auth-guard";
import { LayoutWithHeader } from "@/components/layout-with-header";
import { requireAuth } from "@/lib/auth-utils";
import { ParcelMapWrapper } from "@/components/parcel-map-wrapper";
import {
	getCachedParcelSubstanceAggregations,
	getCachedSubstances,
	getParcelDetail,
	type ParcelDetailType,
} from "@/lib/data-fetcher";
import { ParcelDetail } from "@/components/parcel-detail";
import { CachedDataWrapper } from "@/components/cached-data-wrapper";
import { type Locale } from "@/lib/server-translations";

export type PageProps<T extends Record<string, string>> = {
	params: Promise<T>;
	searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ParcelPage({
	params,
}: PageProps<{ lang: Locale; parcelId: string }>) {
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

	const substanceData = await getCachedParcelSubstanceAggregations(
		parcelId,
		currentYear,
	);
	const substances = await getCachedSubstances();

	const now = new Date();
	const upcomingTreatments = currentYearTreatments.filter(
		(t) => !t.appliedDate || new Date(t.appliedDate) > now,
	);
	const pastTreatments = currentYearTreatments.filter(
		(t) => t.appliedDate && new Date(t.appliedDate) <= now,
	);

	const enrichedSubstanceData = substanceData.map((substance) => {
		const substanceMeta = substances.find((s) => s.name === substance.name);

		return {
			...substance,
			maxDosage: substanceMeta?.maxDosage || -1,
			color: substanceMeta?.color || "rgb(182, 182, 182)",
		};
	});

	return (
		<AuthGuard>
			<CachedDataWrapper>
				<LayoutWithHeader
					title={`${parcel.name}`}
					subtitle={`${parcel.type} - ${parcel.width}m x ${parcel.height}m`}
					icon={<Map />}
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
								substanceData={enrichedSubstanceData}
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
				</LayoutWithHeader>
			</CachedDataWrapper>
		</AuthGuard>
	);
}
