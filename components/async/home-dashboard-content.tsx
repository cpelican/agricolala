import { SubstanceUsageSection } from "../substances/substance-usage-section";
import {
	getCachedSubstanceAggregations,
	getAllYearsSubstanceAggregations,
	getCachedSubstances,
	getCachedDiseaseStageSensitivities,
	getStageByParcel,
	getTreatments,
	getPhenologyObservationsThisYear,
} from "@/lib/data-fetcher";
import {
	type SubstanceRiskTimeline,
	type SubstanceStageRisk,
	getSubstanceRiskTimeline,
	getSubstanceStageRisk,
} from "@/lib/disease-stage-sensitivity";
import { countTreatmentDaysByStage } from "@/lib/phenology";
import { TreatmentStatus } from "@prisma/client";
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
		parcelStages,
		sensitivities,
		treatments,
		observations,
	] = await Promise.all([
		getCachedSubstanceAggregations(userId, currentYear),
		getAllYearsSubstanceAggregations(userId),
		getCachedSubstances(),
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

	// Shown once the grower uses stages: with a current stage, or a treatment applied
	// at a known stage this year.
	const riskTimelineBySubstance: Record<string, SubstanceRiskTimeline> = {};
	for (const substance of substances) {
		const treatmentDaysByStage = countTreatmentDaysByStage(
			doneThisYear
				.filter((treatment) =>
					treatment.productApplications.some((application) =>
						application.product.composition.some(
							(composition) => composition.substanceId === substance.id,
						),
					),
				)
				.map((treatment) => ({
					parcelId: treatment.parcel.id,
					appliedDate: treatment.appliedDate,
				})),
			observations,
		);
		const timeline = getSubstanceRiskTimeline(
			substance.diseaseIds,
			sensitivities,
			treatmentDaysByStage,
		);
		const hasTreatmentAtStage = Object.keys(treatmentDaysByStage).length > 0;
		if (
			timeline &&
			(stageRiskBySubstance[substance.name] || hasTreatmentAtStage)
		) {
			riskTimelineBySubstance[substance.name] = timeline;
		}
	}

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
				coverageResultPromise={coverageResultPromise}
				stageRiskBySubstance={stageRiskBySubstance}
				riskTimelineBySubstance={riskTimelineBySubstance}
			/>
		</div>
	);
}
