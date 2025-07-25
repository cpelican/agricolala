"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
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
import { deleteTreatment } from "@/lib/actions";
import { useTranslations } from "@/lib/translations";

interface DeleteTreatmentDialogProps {
	treatmentId: string;
	treatmentName: string;
	redirectTo?: string;
	trigger: React.ReactNode;
}

export function DeleteTreatmentDialog({
	treatmentId,
	treatmentName,
	redirectTo,
	trigger,
}: DeleteTreatmentDialogProps) {
	const { t, getArray } = useTranslations();
	const [isOpen, setIsOpen] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);
	const router = useRouter();

	const handleDelete = async () => {
		setIsDeleting(true);
		try {
			await deleteTreatment(treatmentId);

			setIsOpen(false);
			if (redirectTo) {
				router.push(redirectTo);
			} else {
				router.refresh();
			}
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
		} catch (_error) {
			console.error("Error deleting treatment");
			// You might want to show a toast notification here
		} finally {
			setIsDeleting(false);
		}
	};

	return (
		<AlertDialog open={isOpen} onOpenChange={setIsOpen}>
			<AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>{t("deleteTreatment.title")}</AlertDialogTitle>
					<AlertDialogDescription>
						{t("deleteTreatment.description").replace("{name}", treatmentName)}
					</AlertDialogDescription>
				</AlertDialogHeader>
				<div className="my-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
					<ul className="text-sm text-destructive space-y-1">
						{getArray("deleteTreatment.warningItems").map((item, index) => (
							<li key={index}>• {item}</li>
						))}
					</ul>
				</div>
				<AlertDialogFooter>
					<AlertDialogCancel disabled={isDeleting}>{t("deleteTreatment.cancel")}</AlertDialogCancel>
					<AlertDialogAction
						onClick={handleDelete}
						disabled={isDeleting}
						className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
					>
						{isDeleting ? (
							<>
								<Trash2 className="h-4 w-4 mr-2 animate-spin" />
								{t("deleteTreatment.deleting")}
							</>
						) : (
							<>
								<Trash2 className="h-4 w-4 mr-2" />
								{t("deleteTreatment.delete")}
							</>
						)}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
