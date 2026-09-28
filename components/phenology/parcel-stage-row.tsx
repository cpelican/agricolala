"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { useTranslations } from "@/contexts/translations-context";
import { getSuggestedStage } from "@/lib/phenology";
import type { CurrentParcelStage } from "@/lib/phenology-observations";
import { StageIcon } from "./stage-icon";
import { UpdateStageDialog } from "./update-stage-dialog";

interface ParcelStageRowProps {
	parcelId: string;
	parcelName: string;
	// Current (non-expired) observation, or null when the stage is unknown.
	observation: CurrentParcelStage | null;
}

// Parcel's current stage with an "Update stage" action.
export function ParcelStageRow({
	parcelId,
	parcelName,
	observation,
}: ParcelStageRowProps) {
	const { t } = useTranslations();
	const [isDialogOpen, setIsDialogOpen] = useState(false);

	return (
		<div className="flex items-center justify-between gap-2">
			<div className="flex items-center gap-2 text-sm">
				{observation ? (
					<>
						<StageIcon stage={observation.stage} className="h-7 w-7" />
						<span>{t(`phenology.stages.${observation.stage}.label`)}</span>
					</>
				) : (
					<span className="text-muted-foreground">
						{t("phenology.unknown")}
					</span>
				)}
			</div>
			<Button
				type="button"
				variant="outline"
				size="sm"
				onClick={() => setIsDialogOpen(true)}
			>
				{t("phenology.updateStage")}
			</Button>
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
