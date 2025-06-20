import { Plus } from "lucide-react";
import { Button } from "./ui/button";
import { useState } from "react";
import { AddTreatmentDialog } from "./add-treatment-dialog";
import { useDiseases, useProducts } from "@/contexts/cached-data-context";

export const AddTreatmentButton = ({ parcelId }: { parcelId: string }) => {
	const [isAddTreatmentOpen, setIsAddTreatmentOpen] = useState(false);
	const diseases = useDiseases();
	const products = useProducts();
	return (
		<>
			<Button
				onClick={() => setIsAddTreatmentOpen(true)}
				style={{ bottom: 100 }}
				className="z-10 fixed right-6 h-20 w-20 rounded-full shadow-lg bg-green-600 hover:bg-green-700"
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
			/>
		</>
	);
};
