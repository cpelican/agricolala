"use client";

import { useRouter } from "next/navigation";
import type React from "react";
import { useEffect, useState } from "react";
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

interface AddParcelDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	selectedLocation?: { lat: number; lng: number } | null;
}

export function AddParcelDialog({
	open,
	onOpenChange,
	selectedLocation,
}: AddParcelDialogProps) {
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [formData, setFormData] = useState<{
		name: string;
		width: string;
		height: string;
		type: CultureType;
		latitude: string;
		longitude: string;
	}>({
		name: "",
		width: "",
		height: "",
		type: CultureType.VINEYARD,
		latitude: "",
		longitude: "",
	});
	const router = useRouter();

	useEffect(() => {
		if (selectedLocation) {
			setFormData((prev) => ({
				...prev,
				latitude: selectedLocation.lat.toString(),
				longitude: selectedLocation.lng.toString(),
			}));
		}
	}, [selectedLocation]);

	const handleSubmit = async (formDataParam: FormData) => {
		setLoading(true);
		setError(null);

		try {
			// Add form data to FormData
			formDataParam.append("name", formData.name);
			formDataParam.append("width", formData.width);
			formDataParam.append("height", formData.height);
			formDataParam.append("type", formData.type);
			formDataParam.append("latitude", formData.latitude);
			formDataParam.append("longitude", formData.longitude);

			await createParcel(formDataParam);

			onOpenChange(false);
			setFormData({
				name: "",
				width: "",
				height: "",
				type: CultureType.VINEYARD,
				latitude: "",
				longitude: "",
			});
			router.refresh();
		} catch (error) {
			console.error("Error adding parcel");
			setError(
				error instanceof Error ? error.message : "Failed to create parcel",
			);
		} finally {
			setLoading(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Add New Parcel</DialogTitle>
					<DialogDescription>
						Add a new parcel to your wineyard management system
					</DialogDescription>
				</DialogHeader>

				{error && (
					<div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
						<p className="text-sm text-destructive">{error}</p>
					</div>
				)}

				<form action={handleSubmit} className="space-y-4">
					<div>
						<Label htmlFor="name">Parcel Name</Label>
						<Input
							id="name"
							name="name"
							value={formData.name}
							onChange={(e) =>
								setFormData({ ...formData, name: e.target.value })
							}
							placeholder="e.g., North Field"
							required
						/>
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div>
							<Label htmlFor="width">Width (meters)</Label>
							<Input
								id="width"
								name="width"
								type="number"
								value={formData.width}
								onChange={(e) =>
									setFormData({ ...formData, width: e.target.value })
								}
								placeholder="100"
								required
							/>
						</div>
						<div>
							<Label htmlFor="height">Height (meters)</Label>
							<Input
								id="height"
								name="height"
								type="number"
								value={formData.height}
								onChange={(e) =>
									setFormData({ ...formData, height: e.target.value })
								}
								placeholder="50"
								required
							/>
						</div>
					</div>

					<div>
						<Label htmlFor="type">Culture Type</Label>
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
								<SelectItem value={CultureType.VINEYARD}>Wineyard</SelectItem>
								<SelectItem value={CultureType.PEACHES}>Peaches</SelectItem>
							</SelectContent>
						</Select>
						<input type="hidden" name="type" value={formData.type} />
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div>
							<Label htmlFor="latitude">Latitude</Label>
							<Input
								id="latitude"
								name="latitude"
								type="number"
								step="any"
								value={formData.latitude}
								onChange={(e) =>
									setFormData({ ...formData, latitude: e.target.value })
								}
								placeholder="45.0000"
								required
							/>
						</div>
						<div>
							<Label htmlFor="longitude">Longitude</Label>
							<Input
								id="longitude"
								name="longitude"
								type="number"
								step="any"
								value={formData.longitude}
								onChange={(e) =>
									setFormData({ ...formData, longitude: e.target.value })
								}
								placeholder="7.0000"
								required
							/>
						</div>
					</div>

					<div className="flex justify-end space-x-2">
						<Button
							type="button"
							variant="outline"
							onClick={() => onOpenChange(false)}
						>
							Cancel
						</Button>
						<Button
							type="submit"
							disabled={loading}
							className="bg-primary-600 hover:bg-primary-700"
						>
							{loading ? "Adding..." : "Add Parcel"}
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	);
}
