import { expect, type Page } from "@playwright/test";
import { addTreatmentFromDialog } from "../support/add-treatment";
import { expectDashboardLoaded } from "../support/assertions";
import { clickMobileNavLink } from "../support/navigation";

/** Home → Treatments → add treatment (stays on Treatments, list updated). */
export async function goToTreatmentsAndAddTreatment(page: Page) {
	await page.goto("/en");
	await clickMobileNavLink(page, "Treatments");
	await expect(page.getByRole("heading", { name: "Treatments" })).toBeVisible();
	await addTreatmentFromDialog(page);
	await expect(
		page.getByRole("heading", { name: "5 Completed" }),
	).toBeVisible();
}

/** Home → Treatments → add treatment → Home (visibility waits throughout). */
export async function runDashboardNavTreatmentFlow(page: Page) {
	await page.goto("/en");
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
