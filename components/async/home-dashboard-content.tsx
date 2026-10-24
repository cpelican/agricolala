import { SubstanceUsageSection } from "../substances/substance-usage-section";
import {
	getCachedSubstanceAggregations,
	getAllYearsSubstanceAggregations,
	getCachedSubstances,
	getCachedDiseases,
	getCachedDiseaseStageSensitivities,
	getStageByParcel,
	getTreatments,
	getPhenologyObservationsThisYear,
} from "@/lib/data-fetcher";
import {
	type DiseaseRiskTimeline,
	type SubstanceStageRisk,
	getDiseaseRiskTimeline,
	getSubstanceStageRisk,
} from "@/lib/disease-stage-sensitivity";
import { countTreatmentDaysByStage } from "@/lib/phenology";
import { TreatmentStatus } from "@prisma/client";
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
		treatments,
		observations,
	] = await Promise.all([
		getCachedSubstanceAggregations(userId, currentYear),
		getAllYearsSubstanceAggregations(userId),
		getCachedSubstances(),
		getCachedDiseases(),
		getStageByParcel(userId),
		getCachedDiseaseStageSensitivities(),
		getTreatments(userId),
		getPhenologyObservationsThisYear(userId),
	]);

	const doneThisYear = treatments.flatMap((treatment) =>
		treatment.status === TreatmentStatus.DONE &&
		treatment.appliedDate?.getFullYear() === currentYear
			? [{ ...treatment, appliedDate: treatment.appliedDate }]
			: [],
	);

	const stageRiskBySubstance: Record<string, SubstanceStageRisk> = {};
	for (const substance of substances) {
		const risk = getSubstanceStageRisk(
			substance.diseaseIds,
			parcelStages,
			sensitivities,
		);
		if (risk) stageRiskBySubstance[substance.name] = risk;
	}

	// Disease risk section: shown once the grower uses stages, with a current stage
	// or a treatment applied at a known stage this year. Dots come from the diseases
	// picked in the treatment modal (pre-filled from the products).
	const diseaseRiskRows: {
		diseaseId: string;
		timeline: DiseaseRiskTimeline;
		hasTreatmentAtStage: boolean;
	}[] = diseases.flatMap((disease) => {
		const treatmentDaysByStage = countTreatmentDaysByStage(
			doneThisYear
				.filter((treatment) => treatment.diseaseIds.includes(disease.id))
				.map((treatment) => ({
					parcelId: treatment.parcel.id,
					appliedDate: treatment.appliedDate,
				})),
			observations,
		);
		const timeline = getDiseaseRiskTimeline(
			disease.id,
			sensitivities,
			treatmentDaysByStage,
		);
		if (!timeline) return [];
		return [
			{
				diseaseId: disease.id,
				timeline,
				hasTreatmentAtStage: Object.keys(treatmentDaysByStage).length > 0,
			},
		];
	});
	const vineyardStageRisk = getSubstanceStageRisk(
		diseaseRiskRows.map(({ diseaseId }) => diseaseId),
		parcelStages,
		sensitivities,
	);
	const showDiseaseRisk =
		vineyardStageRisk !== null ||
		diseaseRiskRows.some(({ hasTreatmentAtStage }) => hasTreatmentAtStage);

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
			{showDiseaseRisk && (
				<DiseaseRiskSection
					stage={vineyardStageRisk?.stage ?? null}
					criticalDiseaseIds={vineyardStageRisk?.criticalDiseaseIds ?? []}
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
