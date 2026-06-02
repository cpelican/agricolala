"use client";

import type { Disease, Product, Substance } from "@prisma/client";
import { Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { useTranslations } from "@/contexts/translations-context";
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
import {
	type getCachedCompositions,
	type ParcelWithTreatments,
} from "@/lib/data-fetcher";
import {
	calculateAdvisedDosePerProduct,
	dedupeDiseaseEntries,
	getDiseaseIdsForProducts,
} from "@/lib/substance-helpers";
import { createTreatment } from "@/lib/actions";
import { useToast } from "@/hooks/use-toast";
import React from "react";

const defaultFormData = (parcelId?: string) => ({
	appliedDate: new Date(),
	diseases: [{ diseaseId: "" }],
	productApplications: [{ productId: "", dose: 0 }],
	waterDose: 10,
	parcelIds: parcelId ? [parcelId] : [""],
});

interface AddTreatmentDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	parcelId?: string;
	parcels?: ParcelWithTreatments[];
	diseases: Pick<Disease, "id" | "name">[];
	products: Pick<Product, "id" | "name" | "maxApplications">[];
	substances: Array<
		Pick<Substance, "id" | "maxDosage" | "name"> & { diseaseIds: string[] }
	>;
	compositions: Awaited<ReturnType<typeof getCachedCompositions>>;
}

const defaultErrors: Record<string, string[]> = {
	appliedDate: [],
	parcelIds: [],
	diseases: [],
	productApplications: [],
	waterDose: [],
} as const;

export function AddTreatmentDialog({
	open,
	onOpenChange,
	parcelId,
	parcels,
	diseases,
	products,
	substances,
	compositions,
}: AddTreatmentDialogProps) {
	const router = useRouter();
	const { t } = useTranslations();
	const { toast } = useToast();
	const isSubmittingRef = useRef(false);
	const [errors, setErrors] = useState<typeof defaultErrors>(defaultErrors);
	const [formData, setFormData] = useState(() => defaultFormData(parcelId));

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
			diseases: dedupeDiseaseEntries(
				prev.diseases.map((disease, i) =>
					i === index ? { ...disease, diseaseId } : disease,
				),
			),
		}));
	};

	const addParcel = () => {
		setFormData((prev) => ({
			...prev,
			parcelIds: prev.parcelIds.length === 0 ? [""] : [...prev.parcelIds, ""],
		}));
	};

	const removeParcel = (index: number) => {
		setFormData((prev) => ({
			...prev,
			parcelIds: prev.parcelIds.filter((_, i) => i !== index),
		}));
	};

	const updateParcel = (index: number, parcelId: string) => {
		setFormData((prev) => ({
			...prev,
			parcelIds: prev.parcelIds.map((id, i) => (i === index ? parcelId : id)),
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
		setFormData((prev) => {
			const productApplications = prev.productApplications.filter(
				(_, i) => i !== index,
			);
			return {
				...prev,
				productApplications,
				diseases: getDiseaseIdsForProducts(
					productApplications.map((p) => p.productId),
					compositions,
					substances,
				),
			};
		});
	};

	const syncDiseasesFromProducts = (
		productApplications: { productId: string; dose: number }[],
	) =>
		getDiseaseIdsForProducts(
			productApplications.map((p) => p.productId),
			compositions,
			substances,
		);

	// Calculate advised dose using the helper function
	const advisedDosePerProduct = calculateAdvisedDosePerProduct(
		formData.parcelIds,
		compositions,
		products,
		substances,
		parcels || [],
	);

	const updateProduct = (
		index: number,
		field: "productId" | "dose",
		value: string | number,
	) => {
		setFormData((prev) => {
			const productApplications = prev.productApplications.map((product, i) =>
				i === index ? { ...product, [field]: value } : product,
			);
			if (field === "productId") {
				return {
					...prev,
					productApplications,
					diseases: syncDiseasesFromProducts(productApplications),
				};
			}
			return { ...prev, productApplications };
		});
	};

	const validateForm = () => {
		const newErrors: Record<string, string[]> = {
			appliedDate: [],
			parcelIds: [],
			diseases: [],
			productApplications: [],
			waterDose: [],
		};

		if (!formData.appliedDate) {
			newErrors.appliedDate.push(
				t("treatments.errors.applicationDateRequired"),
			);
		}

		if (formData.parcelIds.filter((id) => id).length === 0) {
			newErrors.parcelIds.push(t("treatments.errors.parcelRequired"));
		}

		if (!formData.diseases.some((d) => d.diseaseId)) {
			newErrors.diseases.push(t("treatments.errors.diseaseRequired"));
		}

		if (!formData.productApplications.some((p) => p.productId && p.dose > 0)) {
			newErrors.productApplications.push(
				t("treatments.errors.productRequired"),
			);
		}

		if (formData.waterDose <= 0) {
			newErrors.waterDose.push(t("treatments.errors.waterDoseRequired"));
		}

		setErrors(newErrors);
		return Object.values(newErrors).flat().length === 0;
	};

	const handleSubmit = async () => {
		if (isSubmittingRef.current) {
			return;
		}

		if (!validateForm()) {
			return;
		}

		isSubmittingRef.current = true;

		const submitData = new FormData();
		submitData.append(
			"appliedDate",
			formData.appliedDate.toISOString().split("T")[0],
		);

		const parcelIds = parcelId
			? [parcelId]
			: formData.parcelIds.filter((id) => id);
		parcelIds.forEach((id) => submitData.append("parcelIds", id));

		submitData.append(
			"diseases",
			JSON.stringify(dedupeDiseaseEntries(formData.diseases)),
		);
		submitData.append(
			"productApplications",
			JSON.stringify(formData.productApplications),
		);
		submitData.append("waterDose", formData.waterDose.toString());

		onOpenChange(false);
		setFormData(defaultFormData(parcelId));
		setErrors(defaultErrors);

		try {
			await createTreatment(submitData);
			router.refresh();
			toast({
				title: t("treatments.treatmentAdded"),
			});
		} catch (error) {
			console.error("Error creating treatment");
			toast({
				variant: "destructive",
				title: t("treatments.errors.createFailed"),
				description: error instanceof Error ? error.message : undefined,
			});
		} finally {
			isSubmittingRef.current = false;
		}
	};

	const preventNumberEnterSubmit = (
		event: React.KeyboardEvent<HTMLInputElement>,
	) => {
		// On mobile, the keyboard "Done"/"Enter" on number inputs can implicitly submit the form.
		// We only block Enter for number inputs to avoid breaking desktop mouse UX.
		if (event.key === "Enter") {
			event.preventDefault();
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[425px] max-h-[90vh] flex flex-col">
				<DialogHeader>
					<DialogTitle>{t("treatments.addTreatment")}</DialogTitle>
					<DialogDescription>
						{parcelId
							? t("treatments.addTreatmentDescription")
							: t("treatments.addTreatmentFormDescription")}
					</DialogDescription>
				</DialogHeader>

				<form
					className="flex flex-col flex-1 min-h-0"
					onSubmit={(event) => {
						event.preventDefault();
						void handleSubmit();
					}}
				>
					<div className="flex-1 overflow-y-auto -mx-6 px-6 space-y-4">
						<div>
							<Label>{t("treatments.applicationDate")}</Label>
							<Popover>
								<PopoverTrigger asChild>
									<Button
										type="button"
										variant="outline"
										className={cn(
											"w-full pl-3 text-left font-normal",
											!formData.appliedDate && "text-muted-foreground",
										)}
									>
										{formData.appliedDate ? (
											format(formData.appliedDate, "PPP")
										) : (
											<span>{t("treatments.pickDate")}</span>
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
							<input
								type="hidden"
								name="appliedDate"
								value={formData.appliedDate.toISOString().split("T")[0]}
							/>
							{errors.appliedDate.map((er) => (
								<p key={er} className="text-sm text-red-700">
									{er}
								</p>
							))}
						</div>

						{!!parcels?.length && (
							<div className="space-y-4">
								<div className="flex items-center justify-between">
									<Label>{t("treatments.parcels")}</Label>
									<Button
										type="button"
										variant="outline"
										size="sm"
										onClick={addParcel}
									>
										<Plus className="h-4 w-4 mr-2" />
										{t("treatments.addParcel")}
									</Button>
								</div>
								{formData.parcelIds.map((parcelId, index) => (
									<div key={index} className="flex gap-2 items-start mb-1">
										<Select
											value={parcelId}
											onValueChange={(value) => updateParcel(index, value)}
										>
											<SelectTrigger className="flex-1">
												<SelectValue
													placeholder={t("treatments.selectParcel")}
												/>
											</SelectTrigger>
											<SelectContent>
												{parcels.map((parcel) => (
													<SelectItem key={parcel.id} value={parcel.id}>
														{parcel.name} ({parcel.width}m × {parcel.height}m)
													</SelectItem>
												))}
											</SelectContent>
										</Select>
										{formData.parcelIds.length > 1 && (
											<Button
												type="button"
												variant="ghost"
												size="icon"
												onClick={() => removeParcel(index)}
												className="mt-2"
											>
												<X className="h-4 w-4" />
											</Button>
										)}
									</div>
								))}
								{errors.parcelIds.map((er) => (
									<p key={er} className="text-sm text-red-700">
										{er}
									</p>
								))}
							</div>
						)}

						<div className="space-y-4">
							<div className="flex items-center justify-between">
								<div>
									<Label>{t("treatments.products")}</Label>
									<p className="text-sm text-muted-foreground">
										{t("treatments.dosesInGrams")}
									</p>
								</div>
								<Button
									type="button"
									variant="outline"
									size="sm"
									onClick={addProduct}
								>
									<Plus className="h-4 w-4 mr-2" />
									{t("treatments.addProduct")}
								</Button>
							</div>
							{formData.productApplications.map((product, index) => (
								<React.Fragment key={index}>
									<div className="flex gap-2 items-start mb-1">
										<Select
											value={product.productId}
											onValueChange={(value) =>
												updateProduct(index, "productId", value)
											}
										>
											<SelectTrigger className="flex-1">
												<SelectValue
													placeholder={t("treatments.selectProduct")}
												/>
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
											inputMode="decimal"
											enterKeyHint="next"
											placeholder="gr"
											step="0.1"
											min="0.1"
											value={product.dose || ""}
											onChange={(e) =>
												updateProduct(index, "dose", Number(e.target.value))
											}
											onKeyDown={preventNumberEnterSubmit}
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
									{advisedDosePerProduct[product.productId] &&
									advisedDosePerProduct[product.productId] < product.dose ? (
										<p className="text-sm text-orange-400">
											{t("treatments.warnings.doseAdvice")}{" "}
											{Math.round(advisedDosePerProduct[product.productId])}gr
										</p>
									) : null}
								</React.Fragment>
							))}
							{errors.productApplications.map((er) => (
								<p key={er} className="text-sm text-red-700">
									{er}
								</p>
							))}
						</div>

						<div className="space-y-4">
							<div className="flex items-center justify-between">
								<div>
									<Label>{t("treatments.diseases")}</Label>
									<p className="text-sm text-muted-foreground">
										{t("treatments.diseasesFromProductsHint")}
									</p>
								</div>
								<Button
									type="button"
									variant="outline"
									size="sm"
									onClick={addDisease}
								>
									<Plus className="h-4 w-4 mr-2" />
									{t("treatments.addDisease")}
								</Button>
							</div>
							{formData.diseases.map((disease, index) => (
								<div key={index} className="flex gap-2 items-start mb-1">
									<Select
										value={disease.diseaseId}
										onValueChange={(value) => updateDisease(index, value)}
									>
										<SelectTrigger className="flex-1">
											<SelectValue
												placeholder={t("treatments.selectDisease")}
											/>
										</SelectTrigger>
										<SelectContent>
											{diseases
												.filter(
													(d) =>
														d.id === disease.diseaseId ||
														!formData.diseases.some(
															(fd, i) => i !== index && fd.diseaseId === d.id,
														),
												)
												.map((d) => (
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
							{errors.diseases.map((er) => (
								<p key={er} className="text-sm text-red-700">
									{er}
								</p>
							))}
						</div>

						<div>
							<Label htmlFor="waterDose">{t("treatments.waterDose")}</Label>
							<Input
								id="waterDose"
								name="waterDose"
								type="number"
								inputMode="decimal"
								enterKeyHint="done"
								step="0.1"
								min="0"
								value={formData.waterDose}
								onChange={(e) =>
									setFormData((prev) => ({
										...prev,
										waterDose: Number(e.target.value),
									}))
								}
								onKeyDown={preventNumberEnterSubmit}
							/>
							{errors.waterDose.map((er) => (
								<p key={er} className="text-sm text-red-700">
									{er}
								</p>
							))}
						</div>

						{/* Hidden inputs for server action */}
						<input
							type="hidden"
							name="diseases"
							value={JSON.stringify(formData.diseases)}
						/>
						<input
							type="hidden"
							name="productApplications"
							value={JSON.stringify(formData.productApplications)}
						/>
					</div>

					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => onOpenChange(false)}
						>
							{t("treatments.cancel")}
						</Button>
						<Button
							type="submit"
							className="bg-main-gradient hover:bg-primary-700"
						>
							{t("treatments.createTreatment")}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
