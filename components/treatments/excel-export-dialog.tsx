"use client";

import { Download, FileSpreadsheet } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { downloadTreatmentsExcel } from "@/lib/actions";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface ExcelExportDialogProps {
	trigger?: React.ReactNode;
	className?: string;
}

export function ExcelExportDialog({
	trigger,
	className,
}: ExcelExportDialogProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [isDownloading, setIsDownloading] = useState(false);
	const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
	const { toast } = useToast();

	const currentYear = new Date().getFullYear();
	const yearOptions = Array.from({ length: 6 }, (_, i) => currentYear - i);

	const handleDownload = async () => {
		setIsDownloading(true);

		try {
			const result = await downloadTreatmentsExcel(selectedYear);

			if (result.success && result.data) {
				// Convert base64 to blob and download
				const byteCharacters = atob(result.data);
				const byteNumbers = new Array(byteCharacters.length);
				for (let i = 0; i < byteCharacters.length; i++) {
					byteNumbers[i] = byteCharacters.charCodeAt(i);
				}
				const byteArray = new Uint8Array(byteNumbers);
				const blob = new Blob([byteArray], {
					type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
				});

				// Create download link
				const url = window.URL.createObjectURL(blob);
				const link = document.createElement("a");
				link.href = url;
				link.download = result.filename || `treatments-${selectedYear}.xlsx`;
				document.body.appendChild(link);
				link.click();
				document.body.removeChild(link);
				window.URL.revokeObjectURL(url);

				toast({
					title: "Download Complete",
					description: `Your ${selectedYear} treatments have been exported to Excel.`,
				});

				setIsOpen(false);
			}
		} catch (error) {
			console.error("Error downloading Excel:", error);
			toast({
				title: "Download Failed",
				description: "Failed to generate Excel file. Please try again.",
				variant: "destructive",
			});
		} finally {
			setIsDownloading(false);
		}
	};

	return (
		<Dialog open={isOpen} onOpenChange={setIsOpen}>
			<DialogTrigger asChild>
				{trigger || (
					<button
						className={cn(
							"p-2 bg-hsl rounded-full text-primary-700",
							className,
						)}
					>
						<Download className="h-6 w-6" />
					</button>
				)}
			</DialogTrigger>
			<DialogContent className="sm:max-w-[425px]">
				<DialogHeader>
					<DialogTitle>Export Treatments to Excel</DialogTitle>
					<DialogDescription>
						Select the year for which you want to export your treatment data.
					</DialogDescription>
				</DialogHeader>
				<div className="grid gap-4 py-4">
					<div className="grid grid-cols-4 items-center gap-4">
						<Label htmlFor="year" className="text-right">
							Year
						</Label>
						<Select
							value={selectedYear.toString()}
							onValueChange={(value) => setSelectedYear(parseInt(value))}
						>
							<SelectTrigger className="col-span-3">
								<SelectValue placeholder="Select year" />
							</SelectTrigger>
							<SelectContent>
								{yearOptions.map((year) => (
									<SelectItem key={year} value={year.toString()}>
										{year}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				</div>
				<DialogFooter>
					<Button
						type="button"
						variant="outline"
						onClick={() => setIsOpen(false)}
						disabled={isDownloading}
					>
						Cancel
					</Button>
					<Button
						type="button"
						onClick={handleDownload}
						disabled={isDownloading}
					>
						{isDownloading ? (
							<>
								<Download className="h-4 w-4 mr-2 animate-spin" />
								Generating...
							</>
						) : (
							<>
								<FileSpreadsheet className="h-4 w-4 mr-2" />
								Export
							</>
						)}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
