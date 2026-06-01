import type { Page } from "@playwright/test";
import {
	addParcelFromMapDialog,
	type AddParcelOptions,
} from "../support/add-parcel";
import { clickMobileNavLink } from "../support/navigation";

export interface DashboardNavParcelFlowOptions extends AddParcelOptions {
	stepDelayMs?: number;
	stopBeforeReturnHome?: boolean;
}

/**
 * Home → Parcels → add parcel on map → Home.
 */
export async function runDashboardNavParcelFlow(
	page: Page,
	options: DashboardNavParcelFlowOptions = {},
) {
	const { stepDelayMs, stopBeforeReturnHome, ...parcelOptions } = options;

	const pause = async () => {
		if (stepDelayMs) {
			await page.waitForTimeout(stepDelayMs);
		}
	};

	await page.goto("/en");
	await pause();
	await clickMobileNavLink(page, "Parcels");
	await pause();
	const parcelName = await addParcelFromMapDialog(page, parcelOptions);
	await pause();

	if (!stopBeforeReturnHome) {
		await clickMobileNavLink(page, "Home");
		await pause();
	}

	return parcelName;
}
