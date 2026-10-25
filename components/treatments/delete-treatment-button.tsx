"use client";

import { Trash2 } from "lucide-react";
import { DeleteTreatmentDialog } from "./delete-treatment-dialog";
import { cn } from "@/lib/utils";

interface DeleteTreatmentButtonProps {
	treatmentId: string;
	treatmentName: string;
	// Accessible name of the icon-only trigger, e.g. "Delete OxyFlow on parcel A".
	ariaLabel: string;
	redirectTo?: string;
	className?: string;
}

export function DeleteTreatmentButton({
	treatmentId,
	treatmentName,
	ariaLabel,
	redirectTo,
	className,
}: DeleteTreatmentButtonProps) {
	return (
		<DeleteTreatmentDialog
			treatmentId={treatmentId}
			treatmentName={treatmentName}
			redirectTo={redirectTo}
			trigger={
				<button
					type="button"
					aria-label={ariaLabel}
					className={cn(
						"flex size-11 flex-none items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden",
						className,
					)}
				>
					<Trash2 aria-hidden="true" className="size-[18px]" />
				</button>
			}
		/>
	);
}
