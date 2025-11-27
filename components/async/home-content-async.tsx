import { SubstanceUsageSection } from "../substances/substance-usage-section";
import {
	getCachedSubstanceAggregations,
	getAllYearsSubstanceAggregations,
	getCachedSubstances,
	getParcels,
} from "@/lib/data-fetcher";
import { HomeContentUI } from "@/components/misc/home-content-ui";
import { type Locale } from "@/lib/translations-helpers";
import { tServer } from "@/lib/translations-server-only";

interface HomeContentProps {
	locale: Locale;
	userId: string;
}

export async function HomeContentAsync({ locale, userId }: HomeContentProps) {
	const parcels = await getParcels(userId);
	if (parcels.length === 0) {
		return <HomeContentUI />;
	}

	const currentYear = new Date().getFullYear();

	const [currentYearData, allYearsData] = await Promise.all([
		getCachedSubstanceAggregations(userId, currentYear),
		getAllYearsSubstanceAggregations(userId),
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
