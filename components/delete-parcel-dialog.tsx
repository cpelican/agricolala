"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { deleteParcel } from "@/lib/actions";

interface DeleteParcelDialogProps {
	parcelId: string;
	parcelName: string;
	onDelete?: () => void;
	redirectTo?: string;
	trigger?: React.ReactNode;
}

export function DeleteParcelDialog({
	parcelId,
	parcelName,
	onDelete,
	redirectTo,
	trigger,
}: DeleteParcelDialogProps) {
	const [loading, setLoading] = useState(false);
	const [open, setOpen] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const router = useRouter();

	const handleDelete = async () => {
		setLoading(true);
		setError(null);

		try {
			await deleteParcel(parcelId);

			setOpen(false);

			if (onDelete) {
				onDelete();
			}

			if (redirectTo) {
				router.push(redirectTo);
			} else {
				router.refresh();
			}
		} catch (error) {
			console.error("Error deleting parcel");
			setError(
				error instanceof Error ? error.message : "Failed to delete parcel",
			);
		} finally {
			setLoading(false);
		}
	};

	return (
		<AlertDialog open={open} onOpenChange={setOpen}>
			<AlertDialogTrigger asChild>
				{trigger || (
					<Button variant="destructive" size="sm">
						<Trash2 className="h-4 w-4 mr-2" />
						Delete
					</Button>
				)}
			</AlertDialogTrigger>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Delete Parcel</AlertDialogTitle>
					<AlertDialogDescription>
						Are you sure you want to delete &quot;{parcelName}&quot;? This
						action cannot be undone and will permanently remove:
					</AlertDialogDescription>
				</AlertDialogHeader>
				<div className="my-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
					<ul className="text-sm text-destructive space-y-1">
						<li>• The parcel and all its data</li>
						<li>• All treatments associated with this parcel</li>
						<li>• All product applications for those treatments</li>
					</ul>
				</div>
				{error && (
					<div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
						<p className="text-sm text-destructive">{error}</p>
					</div>
				)}
				<AlertDialogFooter>
					<AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
					<AlertDialogAction
						onClick={handleDelete}
						disabled={loading}
						className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
					>
						{loading ? "Deleting..." : "Delete Parcel"}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
