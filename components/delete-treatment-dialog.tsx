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
	const [isOpen, setIsOpen] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);
	const router = useRouter();

	const handleDelete = async () => {
		setIsDeleting(true);
		try {
			const response = await fetch(`/api/treatments/${treatmentId}`, {
				method: "DELETE",
			});

			if (!response.ok) {
				throw new Error("Failed to delete treatment");
			}

			setIsOpen(false);
			if (redirectTo) {
				router.push(redirectTo);
			} else {
				router.refresh();
			}
		} catch (error) {
			console.error("Error deleting treatment:", error);
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
					<AlertDialogTitle>Delete Treatment</AlertDialogTitle>
					<AlertDialogDescription>
						Are you sure you want to delete the treatment &quot;{treatmentName}
						&quot;? This action cannot be undone.
					</AlertDialogDescription>
				</AlertDialogHeader>
				<div className="my-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
					<ul className="text-sm text-destructive space-y-1">
						<li>• The treatment and all its data</li>
						<li>• All product applications for this treatment</li>
						<li>• Substance usage calculations will be updated</li>
					</ul>
				</div>
				<AlertDialogFooter>
					<AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
					<AlertDialogAction
						onClick={handleDelete}
						disabled={isDeleting}
						className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
					>
						{isDeleting ? (
							<>
								<Trash2 className="h-4 w-4 mr-2 animate-spin" />
								Deleting...
							</>
						) : (
							<>
								<Trash2 className="h-4 w-4 mr-2" />
								Delete Treatment
							</>
						)}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
