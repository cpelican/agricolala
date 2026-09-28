import { expect, type Page } from "@playwright/test";
import { additionalTreatmentProductGrams, seededParcel } from "./e2e-data";

interface TreatmentProductEntry {
	productName: string;
	dose: number;
	/** Unit label the dialog should pick from the product ("g" or "ml"). */
	expectedUnit: "g" | "ml";
	/** Stage label to pick in "How do your vines look?" (left untouched if unset). */
	stageLabel?: string;
}

const defaultProductEntry: TreatmentProductEntry = {
	productName: "Pasta cafaro",
	dose: additionalTreatmentProductGrams,
	expectedUnit: "g",
};

export async function addTreatmentFromDialog(
	page: Page,
	{ productName, dose, expectedUnit, stageLabel } = defaultProductEntry,
) {
	await page.getByRole("button", { name: "Add Treatment" }).click();

	const dialog = page.getByRole("dialog", { name: "Add Treatment" });
	await expect(dialog).toBeVisible();
	await dialog.getByText("Select parcel").click();
	await page
		.getByRole("option", {
			name: new RegExp(seededParcel.name),
		})
		.click();
	await dialog.getByText("Select disease").click();
	await page.getByRole("option", { name: "Peronospora" }).click();
	await dialog.getByText("Select product").click();
	await page.getByRole("option", { name: productName }).click();
	// The unit select follows the chosen product's dose unit.
	await expect(
		dialog
			.getByRole("combobox")
			.filter({ hasText: new RegExp(`^${expectedUnit}$`) }),
	).toBeVisible();
	await dialog.getByPlaceholder("g/ml").fill(String(dose));
	if (stageLabel) {
		await dialog.getByRole("radio", { name: stageLabel }).click();
		await expect(dialog.getByRole("radio", { name: stageLabel })).toBeChecked();
	}

	await dialog.getByRole("button", { name: "Create Treatment" }).click();
	await expect(dialog).toBeHidden();
	await expect(
		page.getByText("Treatment added successfully", { exact: true }),
	).toBeVisible();
}
