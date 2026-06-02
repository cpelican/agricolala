import { expect, type Page } from "@playwright/test";
import {
	addParcelFromMapDialog,
	type AddParcelOptions,
} from "../support/add-parcel";
import { expectDashboardLoaded } from "../support/assertions";
import { clickMobileNavLink } from "../support/navigation";
import {
	expectParcelDetailPage,
	openParcelDetailFromList,
} from "../support/parcel-detail";

/** Home → Parcels → add parcel → open parcel detail. */
export async function goToParcelsAndAddParcel(
	page: Page,
	parcelOptions: AddParcelOptions = {},
) {
	await page.goto("/en");
	await clickMobileNavLink(page, "Parcels");
	await expect(page).toHaveURL(/\/en\/parcels\/?$/);
	await expect(page.getByRole("heading", { name: "Parcels" })).toBeVisible();
	const parcelName = await addParcelFromMapDialog(page, parcelOptions);
	await openParcelDetailFromList(page, parcelName);
	await expectParcelDetailPage(page);
	return parcelName;
}

/** Home → Parcels → add parcel → detail → Home (visibility waits throughout). */
export async function runDashboardNavParcelFlow(
	page: Page,
	parcelOptions: AddParcelOptions = {},
) {
	await page.goto("/en");
	await expectDashboardLoaded(page);
	await clickMobileNavLink(page, "Parcels");
	await expect(page).toHaveURL(/\/en\/parcels\/?$/);
	await expect(page.getByRole("heading", { name: "Parcels" })).toBeVisible();
	const parcelName = await addParcelFromMapDialog(page, parcelOptions);
	await openParcelDetailFromList(page, parcelName);
	await expectParcelDetailPage(page);
	await clickMobileNavLink(page, "Home");
	await expect(page).toHaveURL(/\/en\/?$/);
	await expectDashboardLoaded(page);
	return parcelName;
}
