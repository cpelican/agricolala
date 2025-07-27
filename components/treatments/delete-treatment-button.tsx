"use client";

import { Trash2 } from "lucide-react";
import { DeleteTreatmentDialog } from "./delete-treatment-dialog";
import { cn } from "@/lib/utils";

interface DeleteTreatmentButtonProps {
	treatmentId: string;
	treatmentName: string;
	redirectTo?: string;
	iconSize?: "sm" | "md";
	className?: string;
}

export function DeleteTreatmentButton({
	treatmentId,
	treatmentName,
	redirectTo,
	iconSize = "sm",
	className,
}: DeleteTreatmentButtonProps) {
	const iconClass = iconSize === "sm" ? "h-4 w-4" : "h-5 w-5";

	return (
		<DeleteTreatmentDialog
			treatmentId={treatmentId}
			treatmentName={treatmentName}
			redirectTo={redirectTo}
			trigger={
				<button
					className={cn(
						"p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors cursor-pointer",
						className,
					)}
				>
					<Trash2 className={iconClass} />
				</button>
			}
		/>
	);
}
