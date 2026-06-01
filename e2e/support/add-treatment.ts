import { expect, type Page } from "@playwright/test";
import { additionalTreatmentProductGrams, seededParcel } from "./e2e-data";

export async function addTreatmentFromDialog(
	page: Page,
	productDoseGrams = additionalTreatmentProductGrams,
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
	await page.getByRole("option", { name: "Pasta cafaro" }).click();
	await dialog.getByPlaceholder("gr").fill(String(productDoseGrams));

	await dialog.getByRole("button", { name: "Create Treatment" }).click();
	await expect(dialog).toBeHidden();
}
