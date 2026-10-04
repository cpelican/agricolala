"use client";

import type { PhenologicalStage } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { useTranslations } from "@/contexts/translations-context";
import { useToast } from "@/hooks/use-toast";
import { recordPhenologyObservation } from "@/lib/actions-phenology";

// Records today's stage for a parcel, then refreshes the page and shows a toast.
// Resolves to true when the stage was saved.
export function useRecordStage(parcelId: string) {
	const router = useRouter();
	const { t } = useTranslations();
	const { toast } = useToast();
	const [isSubmitting, setIsSubmitting] = useState(false);

	const recordStage = async (stage: PhenologicalStage) => {
		if (isSubmitting) {
			return false;
		}
		setIsSubmitting(true);
		const submitData = new FormData();
		submitData.append("parcelId", parcelId);
		submitData.append("stage", stage);
		try {
			await recordPhenologyObservation(submitData);
			router.refresh();
			toast({ title: t("phenology.saved") });
			return true;
		} catch {
			toast({ variant: "destructive", title: t("phenology.saveFailed") });
			return false;
		} finally {
			setIsSubmitting(false);
		}
	};

	return { recordStage, isSubmitting };
}
