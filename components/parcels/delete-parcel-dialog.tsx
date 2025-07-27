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
import { useTranslations } from "@/contexts/translations-context";

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
	const { t, getArray } = useTranslations();
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
				error instanceof Error ? error.message : t("deleteParcel.error"),
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
						{t("deleteParcel.delete")}
					</Button>
				)}
			</AlertDialogTrigger>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>{t("deleteParcel.title")}</AlertDialogTitle>
					<AlertDialogDescription>
						{t("deleteParcel.description").replace("{name}", parcelName)}
					</AlertDialogDescription>
				</AlertDialogHeader>
				<div className="my-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
					<ul className="text-sm text-destructive space-y-1">
						{getArray("deleteParcel.warningItems").map((item, index) => (
							<li key={index}>• {item}</li>
						))}
					</ul>
				</div>
				{error && (
					<div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
						<p className="text-sm text-destructive">{error}</p>
					</div>
				)}
				<AlertDialogFooter>
					<AlertDialogCancel disabled={loading}>
						{t("deleteParcel.cancel")}
					</AlertDialogCancel>
					<AlertDialogAction
						onClick={handleDelete}
						disabled={loading}
						className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
					>
						{loading ? t("deleteParcel.deleting") : t("deleteParcel.delete")}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
