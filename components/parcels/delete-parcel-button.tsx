"use client";

import { Trash2 } from "lucide-react";
import { DeleteParcelDialog } from "./delete-parcel-dialog";
import { cn } from "@/lib/utils";

interface DeleteParcelButtonProps {
	parcelId: string;
	parcelName: string;
	redirectTo?: string;
	iconSize?: "sm" | "md";
	className?: string;
}

export function DeleteParcelButton({
	parcelId,
	parcelName,
	redirectTo,
	iconSize = "sm",
	className,
}: DeleteParcelButtonProps) {
	const iconClass = iconSize === "sm" ? "h-4 w-4" : "h-5 w-5";

	return (
		<DeleteParcelDialog
			parcelId={parcelId}
			parcelName={parcelName}
			redirectTo={redirectTo}
			trigger={
				<button
					className={cn(
						"p-2 text-white hover:gray-50 transition-colors",
						className,
					)}
				>
					<Trash2 className={iconClass} />
				</button>
			}
		/>
	);
}
