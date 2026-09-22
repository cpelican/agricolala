import { expect, type Page } from "@playwright/test";
import { expectNoVisibleErrors } from "./assertions";
import { addParcelFromMapDialog } from "./add-parcel";
import { clickMobileNavLink } from "./navigation";
import {
	drawParcelButtonLabel,
	locationFailurePattern,
	parcelLocationMapLabel,
} from "./map";

/** Idle home — each map spec should start and end here so tests run in any order. */
export async function goToIdleHome(page: Page) {
	await page.goto("/en");
	await expectNoVisibleErrors(page);
	await expect(page.getByRole("heading", { name: /Welcome/i })).toBeVisible();
}

export async function goToParcelsPage(page: Page) {
	await page.goto("/en");
	await clickMobileNavLink(page, "Parcels");
	await expect(page).toHaveURL(/\/en\/parcels\/?$/);
	await expect(page.getByRole("heading", { name: "Parcels" })).toBeVisible();
	await expectMapReady(page);
}

export async function expectMapReady(page: Page) {
	const map = page.getByRole("application", { name: parcelLocationMapLabel });
	await expect(map).toBeVisible();
	await expect(
		page.getByRole("button", { name: drawParcelButtonLabel }),
	).toBeVisible();
}

export async function expectNoLocationFailureBanner(page: Page) {
	await expect(page.getByText(locationFailurePattern)).toHaveCount(0);
}

function mapHost(page: Page) {
	return page
		.getByRole("application", { name: parcelLocationMapLabel })
		.locator("..");
}

export async function expectLocationFailureBanner(page: Page) {
	await expect(mapHost(page).getByText(locationFailurePattern)).toBeVisible();
}

export async function dismissLocationFailureBanner(page: Page) {
	const host = mapHost(page);
	const message = host.getByText(locationFailurePattern);
	await expect(message).toBeVisible();
	// Banner and pencil share top-right; native click avoids hitting the pencil overlay.
	const closeButton = message
		.locator("..")
		.getByRole("button", { name: "Close" });
	await closeButton.evaluate((button: HTMLButtonElement) => button.click());
	await expect(message).toBeHidden();
}

export async function expectParcelInList(page: Page, parcelName: string) {
	await expect(
		page.getByRole("link", { name: new RegExp(parcelName) }),
	).toBeVisible();
}

export async function addParcelOnMap(page: Page, name: string) {
	await expectMapReady(page);
	return addParcelFromMapDialog(page, { name });
}
