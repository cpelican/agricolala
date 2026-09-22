import { expect, type Page } from "@playwright/test";
import { parcelLocationMapLabel } from "./map";

export async function openParcelDetailFromList(page: Page, parcelName: string) {
	await page.getByRole("link", { name: new RegExp(parcelName) }).click();
	await expect(page).toHaveURL(/\/en\/parcels\/[^/]+$/);
	await expect(
		page.getByRole("heading", { level: 1, name: parcelName }),
	).toBeVisible();
}

export async function expectParcelDetailPage(page: Page) {
	await expect(
		page
			.getByRole("main")
			.getByText("Track your substance applications for this parcel")
			.first(),
	).toBeVisible();
	await expect(
		page.getByRole("main").getByRole("heading", { name: "Past Treatments" }),
	).toBeVisible();
	await expect(
		page.getByRole("application", { name: parcelLocationMapLabel }),
	).toBeVisible();
}
