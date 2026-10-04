"use client";

import type { PhenologicalStage } from "@prisma/client";

import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { useTranslations } from "@/contexts/translations-context";
import { StageIcon } from "./stage-icon";
import { useRecordStage } from "./use-record-stage";

interface ConfirmStageDialogProps {
	parcelId: string;
	// Stage the grower tapped; the dialog is open while it is set.
	stage: PhenologicalStage | null;
	currentStage: PhenologicalStage | null;
	onClose: () => void;
}

// Shows the tapped stage's picture and description before recording it, since
// tiles and pills on a phone show no description (no hover).
export function ConfirmStageDialog({
	parcelId,
	stage,
	currentStage,
	onClose,
}: ConfirmStageDialogProps) {
	const { t } = useTranslations();
	const { recordStage, isSubmitting } = useRecordStage(parcelId);
	const label = (value: PhenologicalStage) =>
		t(`phenology.stages.${value}.label`);

	const handleConfirm = async () => {
		if (stage && (await recordStage(stage))) {
			onClose();
		}
	};

	return (
		<Dialog
			open={stage !== null}
			onOpenChange={(open) => {
				if (!open) {
					onClose();
				}
			}}
		>
			<DialogContent className="sm:max-w-[425px]">
				{stage ? (
					<>
						<DialogHeader>
							<DialogTitle>
								{t("phenology.confirmTitle").replace("{stage}", label(stage))}
							</DialogTitle>
							<DialogDescription>
								{t(`phenology.stages.${stage}.description`)}
							</DialogDescription>
						</DialogHeader>
						<div className="flex flex-col items-center gap-2 py-2">
							<div className="flex h-24 w-24 items-center justify-center rounded-xl border border-primary bg-primary/10">
								<StageIcon stage={stage} className="h-16 w-16" />
							</div>
							{currentStage ? (
								<p className="text-sm text-muted-foreground">
									{t("phenology.confirmCurrent").replace(
										"{stage}",
										label(currentStage),
									)}
								</p>
							) : null}
						</div>
						<DialogFooter>
							<Button type="button" variant="outline" onClick={onClose}>
								{t("phenology.cancel")}
							</Button>
							<Button
								type="button"
								className="bg-main-gradient hover:bg-primary-700"
								onClick={() => void handleConfirm()}
								disabled={isSubmitting}
							>
								{t("phenology.confirm")}
							</Button>
						</DialogFooter>
					</>
				) : null}
			</DialogContent>
		</Dialog>
	);
}
