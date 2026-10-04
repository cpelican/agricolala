"use client";

import type { PhenologicalStage } from "@prisma/client";
import { endOfDay, format } from "date-fns";

import { StagePicker } from "@/components/phenology/stage-picker";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { CurrentParcelStage } from "@/lib/phenology-observations";
import { compareStages, getSuggestedStage } from "@/lib/phenology";

interface TreatmentStageFieldProps {
	t: (key: string) => string;
	// Stage the grower picked; null until they tap one.
	value: PhenologicalStage | null;
	// Highlighted only, never saved unless the grower taps it.
	suggestedStage: PhenologicalStage | null;
	// Latest observation on or before the treatment date among the selected parcels.
	lastObservation: CurrentParcelStage | null;
	// True when the suggestion is the next stage after a stale observation.
	isNextStageSuggestion: boolean;
	onChange: (stage: PhenologicalStage | null) => void;
}

// Most recent observation among the given parcels made by the end of `date`.
function getLatestObservation(
	stages: CurrentParcelStage[],
	parcelIds: string[],
	date: Date,
): CurrentParcelStage | null {
	const dayEnd = endOfDay(date);
	return stages
		.filter(
			(stage) =>
				parcelIds.includes(stage.parcelId) && stage.observedAt <= dayEnd,
		)
		.reduce<CurrentParcelStage | null>(
			(latest, stage) =>
				!latest || stage.observedAt > latest.observedAt ? stage : latest,
			null,
		);
}

// The picked stage plus a suggestion as of the treatment date. Only a stage the
// grower taps is saved, so an untouched picker never records or advances a stage.
export function useTreatmentStage(
	stages: CurrentParcelStage[],
	parcelIds: string[],
	appliedDate: Date,
	chosen: PhenologicalStage | null | undefined,
) {
	const lastObservation = getLatestObservation(stages, parcelIds, appliedDate);
	const suggestedStage = getSuggestedStage(lastObservation, appliedDate);
	return {
		value: chosen ?? null,
		suggestedStage,
		lastObservation,
		isNextStageSuggestion:
			suggestedStage !== null && suggestedStage !== lastObservation?.stage,
	};
}

export function TreatmentStageField({
	t,
	value,
	suggestedStage,
	lastObservation,
	isNextStageSuggestion,
	onChange,
}: TreatmentStageFieldProps) {
	const isEarlierThanLast =
		value !== null &&
		lastObservation !== null &&
		compareStages(value, lastObservation.stage) < 0;
	const showSuggestion = value === null && suggestedStage !== null;

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
			<StagePicker
				t={t}
				value={value}
				suggested={suggestedStage}
				onChange={onChange}
			/>
			{showSuggestion ? (
				<p className="text-xs text-primary">
					{t("phenology.suggestion").replace(
						"{stage}",
						t(`phenology.stages.${suggestedStage}.label`),
					)}
					{isNextStageSuggestion ? ` ${t("phenology.suggestedHint")}` : null}
				</p>
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
