"use client";

import { Plus } from "lucide-react";
import { Button } from "./ui/button";
import { useState } from "react";
import { AddTreatmentDialog } from "./add-treatment-dialog";
import {
	useDiseases,
	useProducts,
	useSubstances,
	useCompositions,
} from "@/contexts/cached-data-context";
import { type ParcelWithTreatments } from "@/lib/data-fetcher";

export const AddTreatmentButton = ({
	parcelId,
	parcels,
}: {
	parcelId?: string;
	parcels: ParcelWithTreatments[];
}) => {
	const [isAddTreatmentOpen, setIsAddTreatmentOpen] = useState(false);
	const diseases = useDiseases();
	const products = useProducts();
	const substances = useSubstances();
	const compositions = useCompositions();
	return (
		<>
			<Button
				onClick={() => setIsAddTreatmentOpen(true)}
				style={{ bottom: 100 }}
				className="z-10 fixed right-6 h-16 w-16 rounded-full shadow-lg bg-primary-600 hover:bg-primary-700"
				size="icon"
			>
				<Plus className="h-6 w-6" />
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
			/>
		</>
	);
};
