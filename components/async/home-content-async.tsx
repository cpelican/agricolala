import { SubstanceUsageSection } from "../substances/substance-usage-section";
import {
	getCachedSubstanceAggregations,
	getAllYearsSubstanceAggregations,
	getCachedSubstances,
	type ParcelWithTreatments,
} from "@/lib/data-fetcher";
import { requireAuth } from "@/lib/auth-utils";
import { HomeContentUI } from "@/components/misc/home-content-ui";
import { type Locale } from "@/lib/translations-helpers";
import { tServer } from "@/lib/translations-server-only";

interface HomeContentProps {
	parcelsPromise: Promise<ParcelWithTreatments[]>;
	locale: Locale;
}

export async function HomeContentAsync({
	parcelsPromise,
	locale,
}: HomeContentProps) {
	const parcels = await parcelsPromise;
	const session = await requireAuth();
	if (parcels.length === 0) {
		return <HomeContentUI />;
	}

	const currentYear = new Date().getFullYear();

	const [currentYearData, allYearsData] = await Promise.all([
		getCachedSubstanceAggregations(session.user.id, currentYear),
		getAllYearsSubstanceAggregations(session.user.id),
	]);

	const substances = await getCachedSubstances();

	const enrichedSubstanceData = currentYearData.map((substance) => {
		const substanceMeta = substances.find((s) => s.name === substance.name);
		return {
			...substance,
			maxDosage: substanceMeta?.maxDosage || 0,
			color: substanceMeta?.color || "rgb(182, 182, 182)",
		};
	});
	const dict = tServer(locale);

	const years = Object.keys(allYearsData).map(Number).sort();
	const hasMultipleYears = years.length > 1;

	return (
		<div className="p-4 space-y-4">
			<SubstanceUsageSection
				substanceData={enrichedSubstanceData}
				description={dict.substances.trackApplicationsHome}
				allYearsData={hasMultipleYears ? allYearsData : undefined}
			/>
		</div>
	);
}
