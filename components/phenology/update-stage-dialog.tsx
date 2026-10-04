"use client";

import type { PhenologicalStage } from "@prisma/client";
import { useState } from "react";

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
import { StagePicker } from "./stage-picker";
import { useRecordStage } from "./use-record-stage";

interface UpdateStageDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	parcelId: string;
	parcelName: string;
	initialStage: PhenologicalStage | null;
}

// Records today's stage for one parcel, without a treatment. Mount it only while
// open so the picker starts from `initialStage` each time.
export function UpdateStageDialog({
	open,
	onOpenChange,
	parcelId,
	parcelName,
	initialStage,
}: UpdateStageDialogProps) {
	const { t } = useTranslations();
	const { recordStage, isSubmitting } = useRecordStage(parcelId);
	const [stage, setStage] = useState(initialStage);

	const handleSave = async () => {
		if (stage && (await recordStage(stage))) {
			onOpenChange(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[425px]">
				<DialogHeader>
					<DialogTitle>{t("phenology.updateStage")}</DialogTitle>
					<DialogDescription>
						{t("phenology.updateStageDescription").replace(
							"{parcel}",
							parcelName,
						)}
					</DialogDescription>
				</DialogHeader>
				<StagePicker t={t} value={stage} onChange={setStage} />
				<DialogFooter>
					<Button
						type="button"
						variant="outline"
						onClick={() => onOpenChange(false)}
					>
						{t("phenology.cancel")}
					</Button>
					<Button
						type="button"
						className="bg-main-gradient hover:bg-primary-700"
						onClick={() => void handleSave()}
						disabled={!stage || isSubmitting}
					>
						{t("phenology.save")}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
