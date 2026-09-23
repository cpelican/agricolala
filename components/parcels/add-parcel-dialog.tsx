"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useTranslations } from "@/contexts/translations-context";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { createParcel } from "@/lib/actions";
import { CultureType } from "@prisma/client";
import {
	type ParcelBoundary,
	computeParcelCentroid,
	formatParcelAreaHa,
} from "@/lib/parcel-geometry";

interface AddParcelDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	boundary?: ParcelBoundary | null;
	previewAreaM2?: number;
}

export function AddParcelDialog({
	open,
	onOpenChange,
	boundary,
	previewAreaM2,
}: AddParcelDialogProps) {
	const { t } = useTranslations();
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [formData, setFormData] = useState<{
		name: string;
		type: CultureType;
		altitude: string;
	}>({
		name: "",
		type: CultureType.VINEYARD,
		altitude: "",
	});
	const router = useRouter();

	const centroid =
		boundary && boundary.length >= 3 ? computeParcelCentroid(boundary) : null;

	useEffect(() => {
		if (!open) {
			setFormData({
				name: "",
				type: CultureType.VINEYARD,
				altitude: "",
			});
			setError(null);
		}
	}, [open]);

	const handleSubmit = async (formDataParam: FormData) => {
		if (!boundary || boundary.length < 3) {
			setError(t("parcels.errors.minPoints"));
			return;
		}

		setLoading(true);
		setError(null);

		try {
			formDataParam.append("name", formData.name);
			formDataParam.append("type", formData.type);
			formDataParam.append("boundary", JSON.stringify(boundary));
			if (formData.altitude) {
				formDataParam.append("altitude", formData.altitude);
			}

			await createParcel(formDataParam);

			onOpenChange(false);
			router.refresh();
		} catch (error) {
			console.error("Error adding parcel");
			setError(
				error instanceof Error
					? error.message
					: t("parcels.errors.createFailed"),
			);
		} finally {
			setLoading(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-h-[90vh] flex flex-col">
				<DialogHeader>
					<DialogTitle>{t("parcels.addNewParcel")}</DialogTitle>
					<DialogDescription>
						{t("parcels.addNewParcelDescription")}
					</DialogDescription>
				</DialogHeader>

				{error && (
					<div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
						<p className="text-sm text-destructive">{error}</p>
					</div>
				)}

				<form action={handleSubmit} className="flex flex-col flex-1 min-h-0">
					<div className="flex-1 overflow-y-auto -mx-6 px-6 space-y-4">
						{previewAreaM2 != null && (
							<div className="rounded-md bg-muted p-3 text-sm">
								<p className="font-medium">{t("parcels.calculatedArea")}</p>
								<p>
									{formatParcelAreaHa(previewAreaM2)} ha (
									{Math.round(previewAreaM2)} m²)
								</p>
							</div>
						)}

						{centroid && (
							<div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
								<div>
									<Label>{t("parcels.latitude")}</Label>
									<p>{centroid.lat.toFixed(6)}</p>
								</div>
								<div>
									<Label>{t("parcels.longitude")}</Label>
									<p>{centroid.lng.toFixed(6)}</p>
								</div>
							</div>
						)}

						<div>
							<Label htmlFor="name">{t("parcels.parcelName")}</Label>
							<Input
								id="name"
								name="name"
								value={formData.name}
								onChange={(e) =>
									setFormData({ ...formData, name: e.target.value })
								}
								placeholder={t("parcels.parcelNamePlaceholder")}
								required
							/>
						</div>

						<div>
							<Label htmlFor="type">{t("parcels.cultureType")}</Label>
							<Select
								value={formData.type}
								onValueChange={(value: CultureType) =>
									setFormData({ ...formData, type: value })
								}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value={CultureType.VINEYARD}>
										{t("parcels.wineyard")}
									</SelectItem>
									<SelectItem value={CultureType.PEACHES}>
										{t("parcels.peaches")}
									</SelectItem>
								</SelectContent>
							</Select>
							<input type="hidden" name="type" value={formData.type} />
						</div>

						<div>
							<Label htmlFor="altitude">{t("parcels.altitude")}</Label>
							<Input
								id="altitude"
								name="altitude"
								type="number"
								step="any"
								value={formData.altitude}
								onChange={(e) =>
									setFormData({ ...formData, altitude: e.target.value })
								}
								placeholder={t("parcels.altitudePlaceholder")}
							/>
						</div>
					</div>

					<div className="flex justify-end space-x-2 pt-4">
						<Button
							type="button"
							variant="outline"
							onClick={() => onOpenChange(false)}
						>
							{t("parcels.cancel")}
						</Button>
						<Button
							type="submit"
							disabled={loading || !boundary}
							className="bg-main-gradient hover:bg-primary-700"
						>
							{loading ? t("parcels.adding") : t("parcels.addParcelButton")}
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	);
}
