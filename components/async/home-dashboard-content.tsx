import { Suspense } from "react";
import { SubstanceUsageSection } from "../substances/substance-usage-section";
import { CoverageWidgetContent } from "./coverage-widget-content";
import { CoverageWidgetSkeleton } from "@/components/skeletons/home-skeleton";
import {
	getCachedSubstanceAggregations,
	getAllYearsSubstanceAggregations,
	getCachedSubstances,
} from "@/lib/data-fetcher";
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
		<div className="space-y-4 p-4">
			<SubstanceUsageSection
				substanceData={enrichedSubstanceData}
				description={dict.substances.trackApplicationsHome}
				allYearsData={hasMultipleYears ? allYearsData : undefined}
			/>
			<Suspense fallback={<CoverageWidgetSkeleton />}>
				<CoverageWidgetContent userId={userId} />
			</Suspense>
		</div>
	);
}
