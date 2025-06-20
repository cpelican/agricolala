"use client";

import type { Disease, Product } from "@prisma/client";
import { Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
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
import { Calendar } from "@/components/ui/calendar";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { type ParcelWithTreatments } from "@/lib/parcel-helpers";

interface AddTreatmentDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	parcelId?: string;
	parcels?: ParcelWithTreatments[];
	diseases: Pick<Disease, "id" | "name">[];
	products: Pick<Product, "id" | "name">[];
}

export function AddTreatmentDialog({
	open,
	onOpenChange,
	parcelId,
	parcels,
	diseases,
	products,
}: AddTreatmentDialogProps) {
	const router = useRouter();
	const [loading, setLoading] = useState(false);
	const [formData, setFormData] = useState({
		appliedDate: new Date(),
		diseases: [{ diseaseId: "" }],
		productApplications: [{ productId: "", dose: 0 }],
		waterDose: 10,
		parcelId,
	});

	const addDisease = () => {
		setFormData((prev) => ({
			...prev,
			diseases: [...prev.diseases, { diseaseId: "" }],
		}));
	};

	const removeDisease = (index: number) => {
		setFormData((prev) => ({
			...prev,
			diseases: prev.diseases.filter((_, i) => i !== index),
		}));
	};

	const updateDisease = (index: number, diseaseId: string) => {
		setFormData((prev) => ({
			...prev,
			diseases: prev.diseases.map((disease, i) =>
				i === index ? { ...disease, diseaseId } : disease,
			),
		}));
	};

	const addProduct = () => {
		setFormData((prev) => ({
			...prev,
			productApplications: [
				...prev.productApplications,
				{ productId: "", dose: 0 },
			],
		}));
	};

	const removeProduct = (index: number) => {
		setFormData((prev) => ({
			...prev,
			productApplications: prev.productApplications.filter(
				(_, i) => i !== index,
			),
		}));
	};

	const updateParcel = (value: string) => {
		setFormData((prev) => ({
			...prev,
			parcelId: value,
		}));
	};

	const updateProduct = (
		index: number,
		field: "productId" | "dose",
		value: string | number,
	) => {
		setFormData((prev) => ({
			...prev,
			productApplications: prev.productApplications.map((product, i) =>
				i === index ? { ...product, [field]: value } : product,
			),
		}));
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);

		try {
			// Basic validation
			const errors: string[] = [];

			if (!formData.appliedDate) {
				errors.push("Application date is required");
			}

			if (!formData.diseases.some((d) => d.diseaseId)) {
				errors.push("At least one disease is required");
			}

			if (
				!formData.productApplications.some((p) => p.productId && p.dose > 0)
			) {
				errors.push("At least one product with valid dose is required");
			}

			if (formData.waterDose <= 0) {
				errors.push("Water dose must be greater than 0");
			}

			if (errors.length > 0) {
				console.error("Validation errors:", errors);
				alert("Please fix the following errors:\n" + errors.join("\n"));
				return;
			}

			console.log("Submitting values:", formData);

			const response = await fetch("/api/treatments", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					...formData,
					parcelId: parcelId ?? formData.parcelId,
				}),
			});

			if (!response.ok) {
				const errorData = await response.text();
				console.error("Response error:", errorData);
				throw new Error(`Failed to create treatment: ${errorData}`);
			}

			onOpenChange(false);
			setFormData({
				appliedDate: new Date(),
				diseases: [{ diseaseId: "" }],
				productApplications: [{ productId: "", dose: 0 }],
				waterDose: 10,
				parcelId: undefined,
			});
			router.refresh();
		} catch (error) {
			console.error("Error creating treatment:", error);
		} finally {
			setLoading(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[425px]">
				<DialogHeader>
					<DialogTitle>Add Treatment</DialogTitle>
					{parcelId && (
						<DialogDescription>
							Add a new treatment for this parcel. Fill in the details below.
						</DialogDescription>
					)}
				</DialogHeader>

				<form onSubmit={handleSubmit} className="space-y-4">
					{!!parcels?.length && (
						<div>
							<Label>Parcels</Label>
							<Select value={parcelId} onValueChange={updateParcel}>
								<SelectTrigger className="flex-1">
									<SelectValue placeholder="Select parcel" />
								</SelectTrigger>
								<SelectContent>
									{parcels.map((p) => (
										<SelectItem key={p.id} value={p.id}>
											{p.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					)}

					<div>
						<Label>Application Date</Label>
						<Popover>
							<PopoverTrigger asChild>
								<Button
									variant={"outline"}
									className={cn(
										"w-full pl-3 text-left font-normal",
										!formData.appliedDate && "text-muted-foreground",
									)}
								>
									{formData.appliedDate ? (
										format(formData.appliedDate, "PPP")
									) : (
										<span>Pick a date</span>
									)}
									<CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
								</Button>
							</PopoverTrigger>
							<PopoverContent className="w-auto p-0" align="start">
								<Calendar
									mode="single"
									selected={formData.appliedDate}
									onSelect={(date) =>
										date &&
										setFormData((prev) => ({ ...prev, appliedDate: date }))
									}
									disabled={(date) =>
										date > new Date() || date < new Date("1900-01-01")
									}
									initialFocus
								/>
							</PopoverContent>
						</Popover>
					</div>

					<div className="space-y-4">
						<div className="flex items-center justify-between">
							<Label>Diseases</Label>
							<Button
								type="button"
								variant="outline"
								size="sm"
								onClick={addDisease}
							>
								<Plus className="h-4 w-4 mr-2" />
								Add Disease
							</Button>
						</div>
						{formData.diseases.map((disease, index) => (
							<div key={index} className="flex gap-2 items-start">
								<Select
									value={disease.diseaseId}
									onValueChange={(value) => updateDisease(index, value)}
								>
									<SelectTrigger className="flex-1">
										<SelectValue placeholder="Select disease" />
									</SelectTrigger>
									<SelectContent>
										{diseases.map((d) => (
											<SelectItem key={d.id} value={d.id}>
												{d.name}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								{index > 0 && (
									<Button
										type="button"
										variant="ghost"
										size="icon"
										onClick={() => removeDisease(index)}
										className="mt-2"
									>
										<X className="h-4 w-4" />
									</Button>
								)}
							</div>
						))}
					</div>

					<div className="space-y-4">
						<div className="flex items-center justify-between">
							<div>
								<Label>Products</Label>
								<p className="text-sm text-muted-foreground">
									Doses in grams (g)
								</p>
							</div>
							<Button
								type="button"
								variant="outline"
								size="sm"
								onClick={addProduct}
							>
								<Plus className="h-4 w-4 mr-2" />
								Add Product
							</Button>
						</div>
						{formData.productApplications.map((product, index) => (
							<div key={index} className="flex gap-2 items-start">
								<Select
									value={product.productId}
									onValueChange={(value) =>
										updateProduct(index, "productId", value)
									}
								>
									<SelectTrigger className="flex-1">
										<SelectValue placeholder="Select product" />
									</SelectTrigger>
									<SelectContent>
										{products.map((p) => (
											<SelectItem key={p.id} value={p.id}>
												{p.name}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								<Input
									type="number"
									placeholder="gr"
									step="0.1"
									min="0.1"
									value={product.dose || ""}
									onChange={(e) =>
										updateProduct(index, "dose", Number(e.target.value))
									}
									className="w-24"
								/>
								{index > 0 && (
									<Button
										type="button"
										variant="ghost"
										size="icon"
										onClick={() => removeProduct(index)}
										className="mt-2"
									>
										<X className="h-4 w-4" />
									</Button>
								)}
							</div>
						))}
					</div>

					<div>
						<Label htmlFor="waterDose">Water Dose (L)</Label>
						<Input
							id="waterDose"
							type="number"
							step="0.1"
							min="0"
							value={formData.waterDose}
							onChange={(e) =>
								setFormData((prev) => ({
									...prev,
									waterDose: Number(e.target.value),
								}))
							}
						/>
					</div>

					<DialogFooter>
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
							{loading ? "Creating..." : "Create Treatment"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
