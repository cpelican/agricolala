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
import { useTranslations } from "@/contexts/translations-context";

export const AddTreatmentButton = ({
	parcelId,
	parcels,
	stages,
}: {
	parcelId?: string;
	parcels: ParcelWithTreatments[];
	stages: CurrentParcelStage[];
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
				className="z-10 fixed right-6 h-16 w-16 rounded-full shadow-lg bg-solid-gradient transition hover:brightness-110 focus-visible:brightness-110 active:scale-95 [&_svg]:size-8"
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
			/>
		</>
	);
};
