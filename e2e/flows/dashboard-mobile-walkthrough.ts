import { expect, type Page } from "@playwright/test";
import { addParcelFromMapDialog } from "../support/add-parcel";
import { addTreatmentFromDialog } from "../support/add-treatment";
import { expectDashboardLoaded } from "../support/assertions";
import { clickMobileNavLink } from "../support/navigation";

/** Home → Parcels → add parcel → Home → Treatments → add treatment → Home. */
export async function runDashboardMobileWalkthroughFlow(page: Page) {
	await page.goto("/en");
	await expectDashboardLoaded(page);

	await clickMobileNavLink(page, "Parcels");
	await expect(page.getByRole("heading", { name: "Parcels" })).toBeVisible();
	const parcelName = await addParcelFromMapDialog(page);
	await expect(page.getByRole("heading", { name: parcelName })).toBeVisible();
	await clickMobileNavLink(page, "Home");
	await expectDashboardLoaded(page);

	await clickMobileNavLink(page, "Treatments");
	await expect(page.getByRole("heading", { name: "Treatments" })).toBeVisible();
	await addTreatmentFromDialog(page);
	await expect(
		page.getByRole("heading", { name: "5 Completed" }),
	).toBeVisible();
	await clickMobileNavLink(page, "Home");
	await expectDashboardLoaded(page);
}
