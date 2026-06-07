"use client";

import type { Disease, Product, Substance } from "@prisma/client";
import { useRouter } from "next/navigation";
import React, { useRef, useState } from "react";

import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { useTranslations } from "@/contexts/translations-context";
import { useToast } from "@/hooks/use-toast";
import { createTreatment } from "@/lib/actions";
import type {
	ParcelWithTreatments,
	getCachedCompositions,
} from "@/lib/data-fetcher";
import {
	calculateAdvisedDosePerProduct,
	dedupeDiseaseEntries,
	getDiseaseIdsForProducts,
} from "@/lib/substance-helpers";

import {
	AddTreatmentDialogForm,
	type AddTreatmentDialogFormData,
	type AddTreatmentDialogFormErrors,
} from "./add-treatment-dialog-form";

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

const defaultErrors: AddTreatmentDialogFormErrors = {
	appliedDate: [],
	parcelIds: [],
	diseases: [],
	productApplications: [],
	waterDose: [],
};

function buildDefaultFormData(parcelId?: string): AddTreatmentDialogFormData {
	return {
		appliedDate: new Date(),
		diseases: [{ diseaseId: "" }],
		productApplications: [{ productId: "", dose: 0 }],
		waterDose: 10,
		parcelIds: parcelId ? [parcelId] : [""],
	};
}

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
	const [errors, setErrors] =
		useState<AddTreatmentDialogFormErrors>(defaultErrors);
	const [formData, setFormData] = useState<AddTreatmentDialogFormData>(() =>
		buildDefaultFormData(parcelId),
	);

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

	const updateParcel = (index: number, newParcelId: string) => {
		setFormData((prev) => ({
			...prev,
			parcelIds: prev.parcelIds.map((id, i) =>
				i === index ? newParcelId : id,
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

	const syncDiseasesFromProducts = (
		productApplications: { productId: string; dose: number }[],
	) =>
		getDiseaseIdsForProducts(
			productApplications.map((p) => p.productId),
			compositions,
			substances,
		);

	const removeProduct = (index: number) => {
		setFormData((prev) => {
			const productApplications = prev.productApplications.filter(
				(_, i) => i !== index,
			);
			return {
				...prev,
				productApplications,
				diseases: syncDiseasesFromProducts(productApplications),
			};
		});
	};

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

	const advisedDosePerProduct = calculateAdvisedDosePerProduct(
		formData.parcelIds,
		compositions,
		products,
		substances,
		parcels || [],
	);

	const validateForm = () => {
		const nextErrors: AddTreatmentDialogFormErrors = {
			appliedDate: [],
			parcelIds: [],
			diseases: [],
			productApplications: [],
			waterDose: [],
		};

		if (!formData.appliedDate) {
			nextErrors.appliedDate.push(
				t("treatments.errors.applicationDateRequired"),
			);
		}
		if (formData.parcelIds.filter(Boolean).length === 0) {
			nextErrors.parcelIds.push(t("treatments.errors.parcelRequired"));
		}
		if (!formData.diseases.some((d) => d.diseaseId)) {
			nextErrors.diseases.push(t("treatments.errors.diseaseRequired"));
		}
		if (!formData.productApplications.some((p) => p.productId && p.dose > 0)) {
			nextErrors.productApplications.push(
				t("treatments.errors.productRequired"),
			);
		}
		if (formData.waterDose <= 0) {
			nextErrors.waterDose.push(t("treatments.errors.waterDoseRequired"));
		}

		setErrors(nextErrors);
		return Object.values(nextErrors).flat().length === 0;
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
		(parcelId ? [parcelId] : formData.parcelIds.filter(Boolean)).forEach((id) =>
			submitData.append("parcelIds", id),
		);
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
		setFormData(buildDefaultFormData(parcelId));
		setErrors(defaultErrors);

		try {
			await createTreatment(submitData);
			router.refresh();
			toast({ title: t("treatments.treatmentAdded") });
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

				<AddTreatmentDialogForm
					t={t}
					parcelId={parcelId}
					parcels={parcels}
					diseases={diseases}
					products={products}
					advisedDosePerProduct={advisedDosePerProduct}
					formData={formData}
					errors={errors}
					onCancel={() => onOpenChange(false)}
					onSubmit={() => void handleSubmit()}
					onPreventEnterSubmit={() => {}}
					onNumberInputKeyDown={preventNumberEnterSubmit}
					onAddParcel={addParcel}
					onRemoveParcel={removeParcel}
					onUpdateParcel={updateParcel}
					onAddProduct={addProduct}
					onRemoveProduct={removeProduct}
					onUpdateProduct={updateProduct}
					onAddDisease={addDisease}
					onRemoveDisease={removeDisease}
					onUpdateDisease={updateDisease}
					onWaterDoseChange={(value) =>
						setFormData((prev) => ({ ...prev, waterDose: value }))
					}
					onAppliedDateChange={(value) =>
						setFormData((prev) => ({ ...prev, appliedDate: value }))
					}
				/>
			</DialogContent>
		</Dialog>
	);
}
