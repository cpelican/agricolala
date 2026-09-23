import { SubstanceUsageSection } from "../substances/substance-usage-section";
import {
	getCachedSubstanceAggregations,
	getAllYearsSubstanceAggregations,
	getCachedSubstances,
} from "@/lib/data-fetcher";
import { getCoverageWidgetData } from "@/lib/get-coverage-widget-data";
import { type Locale } from "@/lib/translations-helpers";
import { tServer } from "@/lib/translations-server-only";

interface HomeDashboardContentProps {
	locale: Locale;
	userId: string;
}

export async function HomeDashboardContent({
	locale,
	userId,
}: HomeDashboardContentProps) {
	const currentYear = new Date().getFullYear();

	// Not awaited here: streamed into SubstanceUsageSection via Suspense so a
	// slow weather API doesn't block the rest of the dashboard's first render.
	const coverageDataPromise = getCoverageWidgetData(userId);

	const [currentYearData, allYearsData, substances] = await Promise.all([
		getCachedSubstanceAggregations(userId, currentYear),
		getAllYearsSubstanceAggregations(userId),
		getCachedSubstances(),
	]);

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
		<div className="space-y-4 p-4">
			<SubstanceUsageSection
				substanceData={enrichedSubstanceData}
				description={dict.substances.trackApplicationsHome}
				allYearsData={hasMultipleYears ? allYearsData : undefined}
				coverageDataPromise={coverageDataPromise}
			/>
		</div>
	);
}
