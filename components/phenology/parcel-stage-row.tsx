"use client";

import { ArrowRight } from "lucide-react";
import { useState } from "react";

import { useTranslations } from "@/contexts/translations-context";
import { getNextStage, getSuggestedStage } from "@/lib/phenology";
import type { CurrentParcelStage } from "@/lib/phenology-observations";
import { StageIcon } from "./stage-icon";
import { UpdateStageDialog } from "./update-stage-dialog";
import { useRecordStage } from "./use-record-stage";

interface ParcelStageRowProps {
	parcelId: string;
	parcelName: string;
	// Current (non-expired) observation, or null when the stage is unknown.
	observation: CurrentParcelStage | null;
}

const PILL_CLASS =
	"inline-flex items-center gap-1.5 rounded-full border border-dashed border-primary/40 px-3 py-1.5 text-sm font-medium text-primary transition-colors hover:bg-primary/5 disabled:opacity-50";

// Parcel list card footer: current stage, plus one tap to mark the next stage
// (or a dialog to pick one when the stage is unknown or already ripe).
export function ParcelStageRow({
	parcelId,
	parcelName,
	observation,
}: ParcelStageRowProps) {
	const { t } = useTranslations();
	const { recordStage, isSubmitting } = useRecordStage(parcelId);
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const nextStage = observation ? getNextStage(observation.stage) : null;

	return (
		<div className="flex items-center justify-between gap-2 border-t pt-3">
			<div className="flex items-center gap-2">
				{observation ? (
					<>
						<StageIcon stage={observation.stage} className="h-7 w-7" />
						<span className="font-medium">
							{t(`phenology.stages.${observation.stage}.label`)}
						</span>
					</>
				) : (
					<span className="text-sm text-muted-foreground">
						{t("phenology.unknown")}
					</span>
				)}
			</div>
			{nextStage ? (
				<button
					type="button"
					className={PILL_CLASS}
					disabled={isSubmitting}
					onClick={() => void recordStage(nextStage)}
				>
					<StageIcon stage={nextStage} className="h-5 w-5 opacity-50" />
					{t("phenology.markStage").replace(
						"{stage}",
						t(`phenology.stages.${nextStage}.label`),
					)}
					<ArrowRight className="h-4 w-4" />
				</button>
			) : (
				<button
					type="button"
					className={PILL_CLASS}
					onClick={() => setIsDialogOpen(true)}
				>
					{t("phenology.updateStage")}
					<ArrowRight className="h-4 w-4" />
				</button>
			)}
			{isDialogOpen ? (
				<UpdateStageDialog
					open
					onOpenChange={setIsDialogOpen}
					parcelId={parcelId}
					parcelName={parcelName}
					initialStage={getSuggestedStage(observation, new Date())}
				/>
			) : null}
		</div>
	);
}
