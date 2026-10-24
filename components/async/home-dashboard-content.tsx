import { SubstanceUsageSection } from "../substances/substance-usage-section";
import {
	getCachedSubstanceAggregations,
	getAllYearsSubstanceAggregations,
	getCachedSubstances,
	getCachedDiseases,
	getCachedDiseaseStageSensitivities,
	getStageByParcel,
} from "@/lib/data-fetcher";
import {
	type SubstanceStageRisk,
	getDiseaseRiskTimeline,
	getSubstanceStageRisk,
} from "@/lib/disease-stage-sensitivity";
import { DiseaseRiskSection } from "../phenology/disease-risk-section";
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
	const coverageResultPromise = getCoverageWidgetData(userId);

	const [
		currentYearData,
		allYearsData,
		substances,
		diseases,
		parcelStages,
		sensitivities,
	] = await Promise.all([
		getCachedSubstanceAggregations(userId, currentYear),
		getAllYearsSubstanceAggregations(userId),
		getCachedSubstances(),
		getCachedDiseases(),
		getStageByParcel(userId),
		getCachedDiseaseStageSensitivities(),
	]);

	const stageRiskBySubstance: Record<string, SubstanceStageRisk> = {};
	for (const substance of substances) {
		const risk = getSubstanceStageRisk(
			substance.diseaseIds,
			parcelStages,
			sensitivities,
		);
		if (risk) stageRiskBySubstance[substance.name] = risk;
	}

	// Disease risk section: one row per disease of the matrix, shown once a parcel has
	// a current stage.
	const diseaseRiskRows = diseases.flatMap((disease) => {
		const timeline = getDiseaseRiskTimeline(disease.id, sensitivities);
		return timeline ? [{ diseaseId: disease.id, timeline }] : [];
	});
	const vineyardStageRisk = getSubstanceStageRisk(
		diseaseRiskRows.map(({ diseaseId }) => diseaseId),
		parcelStages,
		sensitivities,
	);

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
			{vineyardStageRisk && (
				<DiseaseRiskSection
					stage={vineyardStageRisk.stage}
					criticalDiseaseIds={vineyardStageRisk.criticalDiseaseIds}
					rows={diseaseRiskRows}
				/>
			)}
			<SubstanceUsageSection
				substanceData={enrichedSubstanceData}
				description={dict.substances.trackApplicationsHome}
				allYearsData={hasMultipleYears ? allYearsData : undefined}
				coverageResultPromise={coverageResultPromise}
				stageRiskBySubstance={stageRiskBySubstance}
			/>
		</div>
	);
}
