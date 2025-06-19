"use client";

import { Trash2 } from "lucide-react";
import { DeleteParcelDialog } from "./delete-parcel-dialog";

interface DeleteParcelButtonProps {
	parcelId: string;
	parcelName: string;
	redirectTo?: string;
	iconSize?: "sm" | "md";
}

export function DeleteParcelButton({
	parcelId,
	parcelName,
	redirectTo,
	iconSize = "sm",
}: DeleteParcelButtonProps) {
	const iconClass = iconSize === "sm" ? "h-4 w-4" : "h-5 w-5";

	return (
		<DeleteParcelDialog
			parcelId={parcelId}
			parcelName={parcelName}
			redirectTo={redirectTo}
			trigger={
				<button className="p-2 text-red-500 hover:text-red-700 transition-colors">
					<Trash2 className={iconClass} />
				</button>
			}
		/>
	);
}
