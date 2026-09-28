"use client";

import type { PhenologicalStage } from "@prisma/client";
import { format } from "date-fns";

import { StagePicker } from "@/components/phenology/stage-picker";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { CurrentParcelStage } from "@/lib/phenology-observations";
import { compareStages, getSuggestedStage } from "@/lib/phenology";

interface TreatmentStageFieldProps {
	t: (key: string) => string;
	value: PhenologicalStage | null;
	// Latest current observation among the selected parcels, if any.
	lastObservation: CurrentParcelStage | null;
	// True when `value` is the next stage suggested after a stale observation.
	isNextStageSuggestion: boolean;
	appliedDate: Date;
	onChange: (stage: PhenologicalStage | null) => void;
}

// Most recent current observation among the given parcels.
function getLatestObservation(
	stages: CurrentParcelStage[],
	parcelIds: string[],
): CurrentParcelStage | null {
	return stages
		.filter((stage) => parcelIds.includes(stage.parcelId))
		.reduce<CurrentParcelStage | null>(
			(latest, stage) =>
				!latest || stage.observedAt > latest.observedAt ? stage : latest,
			null,
		);
}

// Stage shown in the picker: the grower's choice once they touched it (`chosen`
// is then a stage or null for "Skip"), else the suggestion from the parcels' stages.
export function useTreatmentStage(
	stages: CurrentParcelStage[],
	parcelIds: string[],
	chosen: PhenologicalStage | null | undefined,
) {
	const lastObservation = getLatestObservation(stages, parcelIds);
	const suggestedStage = getSuggestedStage(lastObservation, new Date());
	const isUntouched = chosen === undefined;
	return {
		value: isUntouched ? suggestedStage : chosen,
		lastObservation,
		isNextStageSuggestion:
			isUntouched &&
			suggestedStage !== null &&
			suggestedStage !== lastObservation?.stage,
	};
}

export function TreatmentStageField({
	t,
	value,
	lastObservation,
	isNextStageSuggestion,
	appliedDate,
	onChange,
}: TreatmentStageFieldProps) {
	const isEarlierThanLast =
		value !== null &&
		lastObservation !== null &&
		lastObservation.observedAt <= appliedDate &&
		compareStages(value, lastObservation.stage) < 0;

	return (
		<div className="space-y-2">
			<div className="flex items-center justify-between">
				<div>
					<Label>{t("phenology.title")}</Label>
					<p className="text-sm text-muted-foreground">
						{t("phenology.optional")}
					</p>
				</div>
				{value ? (
					<Button
						type="button"
						variant="ghost"
						size="sm"
						onClick={() => onChange(null)}
					>
						{t("phenology.skip")}
					</Button>
				) : null}
			</div>
			<StagePicker t={t} value={value} onChange={onChange} />
			{isNextStageSuggestion ? (
				<p className="text-xs text-primary">{t("phenology.suggestedHint")}</p>
			) : null}
			{isEarlierThanLast && lastObservation ? (
				<p className="text-sm text-orange-400">
					{t("phenology.earlierWarning").replace(
						"{date}",
						format(lastObservation.observedAt, "PP"),
					)}
				</p>
			) : null}
		</div>
	);
}
