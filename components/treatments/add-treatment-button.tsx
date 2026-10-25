"use client";

import { Plus } from "lucide-react";
import { Button } from "../ui/button";
import { useState } from "react";
import { AddTreatmentDialog } from "./add-treatment-dialog";
import {
	useDiseases,
	useProducts,
	useSubstances,
	useCompositions,
} from "@/contexts/cached-data-context";
import { type ParcelWithTreatments } from "@/lib/data-fetcher";
import type { CurrentParcelStage } from "@/lib/phenology-observations";
import type { ParcelStageEstimate } from "@/lib/phenology-estimate";
import { useTranslations } from "@/contexts/translations-context";

export const AddTreatmentButton = ({
	parcelId,
	parcels,
	stages,
	stageEstimates = [],
}: {
	parcelId?: string;
	parcels: ParcelWithTreatments[];
	stages: CurrentParcelStage[];
	stageEstimates?: ParcelStageEstimate[];
}) => {
	const [isAddTreatmentOpen, setIsAddTreatmentOpen] = useState(false);
	const diseases = useDiseases();
	const products = useProducts();
	const substances = useSubstances();
	const compositions = useCompositions();
	const { t } = useTranslations();
	return (
		<>
			<Button
				aria-label={t("treatments.addTreatment")}
				onClick={() => setIsAddTreatmentOpen(true)}
				style={{ bottom: 100 }}
				className="z-10 fixed right-4 size-14 rounded-full transition active:scale-95 [&_svg]:size-[26px]"
				size="icon"
			>
				<Plus />
			</Button>
			<AddTreatmentDialog
				open={isAddTreatmentOpen}
				onOpenChange={setIsAddTreatmentOpen}
				parcelId={parcelId}
				diseases={diseases}
				products={products}
				parcels={parcels}
				substances={substances}
				compositions={compositions}
				stages={stages}
				stageEstimates={stageEstimates}
			/>
		</>
	);
};
