import { expect, type Page } from "@playwright/test";
import {
	addParcelFromMapDialog,
	type AddParcelOptions,
} from "../support/add-parcel";
import { expectDashboardLoaded } from "../support/assertions";
import { clickMobileNavLink } from "../support/navigation";

/** Home → Parcels → add parcel on map (stays on parcel detail). */
export async function goToParcelsAndAddParcel(
	page: Page,
	parcelOptions: AddParcelOptions = {},
) {
	await page.goto("/en");
	await clickMobileNavLink(page, "Parcels");
	await expect(page.getByRole("heading", { name: "Parcels" })).toBeVisible();
	const parcelName = await addParcelFromMapDialog(page, parcelOptions);
	await expect(page.getByRole("heading", { name: parcelName })).toBeVisible();
	return parcelName;
}

/** Home → Parcels → add parcel → Home (visibility waits throughout). */
export async function runDashboardNavParcelFlow(
	page: Page,
	parcelOptions: AddParcelOptions = {},
) {
	await page.goto("/en");
	await expectDashboardLoaded(page);
	await clickMobileNavLink(page, "Parcels");
	await expect(page.getByRole("heading", { name: "Parcels" })).toBeVisible();
	const parcelName = await addParcelFromMapDialog(page, parcelOptions);
	await expect(page.getByRole("heading", { name: parcelName })).toBeVisible();
	await clickMobileNavLink(page, "Home");
	await expectDashboardLoaded(page);
	return parcelName;
}
