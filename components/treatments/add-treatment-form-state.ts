import { ProductDoseUnit } from "@prisma/client";

import type {
	AddTreatmentDialogFormData,
	AddTreatmentDialogFormErrors,
} from "./add-treatment-dialog-form";

export const defaultErrors: AddTreatmentDialogFormErrors = {
	appliedDate: [],
	parcelIds: [],
	diseases: [],
	productApplications: [],
	waterDose: [],
};

export function buildDefaultFormData(
	parcelId?: string,
): AddTreatmentDialogFormData {
	return {
		appliedDate: new Date(),
		diseases: [{ diseaseId: "" }],
		productApplications: [
			{ productId: "", dose: 0, doseUnit: ProductDoseUnit.GRAM },
		],
		waterDose: 10,
		parcelIds: parcelId ? [parcelId] : [""],
	};
}

export function validateTreatmentForm(
	formData: AddTreatmentDialogFormData,
	t: (key: string) => string,
): AddTreatmentDialogFormErrors {
	const nextErrors: AddTreatmentDialogFormErrors = {
		appliedDate: [],
		parcelIds: [],
		diseases: [],
		productApplications: [],
		waterDose: [],
	};

	if (!formData.appliedDate) {
		nextErrors.appliedDate.push(t("treatments.errors.applicationDateRequired"));
	}
	if (formData.parcelIds.filter(Boolean).length === 0) {
		nextErrors.parcelIds.push(t("treatments.errors.parcelRequired"));
	}
	if (!formData.diseases.some((d) => d.diseaseId)) {
		nextErrors.diseases.push(t("treatments.errors.diseaseRequired"));
	}
	if (!formData.productApplications.some((p) => p.productId && p.dose > 0)) {
		nextErrors.productApplications.push(t("treatments.errors.productRequired"));
	}
	if (formData.waterDose <= 0) {
		nextErrors.waterDose.push(t("treatments.errors.waterDoseRequired"));
	}
	return nextErrors;
}
