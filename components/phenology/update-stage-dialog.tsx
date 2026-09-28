"use client";

import type { PhenologicalStage } from "@prisma/client";
import { useRouter } from "next/navigation";
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
import { useToast } from "@/hooks/use-toast";
import { recordPhenologyObservation } from "@/lib/actions-phenology";
import { StagePicker } from "./stage-picker";

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
	const router = useRouter();
	const { t } = useTranslations();
	const { toast } = useToast();
	const [stage, setStage] = useState(initialStage);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const handleSave = async () => {
		if (!stage || isSubmitting) {
			return;
		}
		setIsSubmitting(true);
		const submitData = new FormData();
		submitData.append("parcelId", parcelId);
		submitData.append("stage", stage);
		try {
			await recordPhenologyObservation(submitData);
			onOpenChange(false);
			router.refresh();
			toast({ title: t("phenology.saved") });
		} catch {
			toast({ variant: "destructive", title: t("phenology.saveFailed") });
		} finally {
			setIsSubmitting(false);
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
