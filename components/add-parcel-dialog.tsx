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
	const [formData, setFormData] = useState({
		name: "",
		width: "",
		height: "",
		type: "VINEYARD",
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

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);

		try {
			const response = await fetch("/api/parcels", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					name: formData.name,
					width: Number.parseFloat(formData.width),
					height: Number.parseFloat(formData.height),
					type: formData.type,
					latitude: Number.parseFloat(formData.latitude),
					longitude: Number.parseFloat(formData.longitude),
				}),
			});

			if (response.ok) {
				onOpenChange(false);
				setFormData({
					name: "",
					width: "",
					height: "",
					type: "VINEYARD",
					latitude: "",
					longitude: "",
				});
				router.refresh();
			}
		} catch (error) {
			console.error("Error adding parcel:", error);
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

				<form onSubmit={handleSubmit} className="space-y-4">
					<div>
						<Label htmlFor="name">Parcel Name</Label>
						<Input
							id="name"
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
							onValueChange={(value) =>
								setFormData({ ...formData, type: value })
							}
						>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="VINEYARD">Wineyard</SelectItem>
								<SelectItem value="PEACHES">Peaches</SelectItem>
							</SelectContent>
						</Select>
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div>
							<Label htmlFor="latitude">Latitude</Label>
							<Input
								id="latitude"
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
							className="bg-green-600 hover:bg-green-700"
						>
							{loading ? "Adding..." : "Add Parcel"}
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	);
}
