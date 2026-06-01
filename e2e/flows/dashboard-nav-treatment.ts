import type { Page } from "@playwright/test";
import { addTreatmentFromDialog } from "../support/add-treatment";
import { clickMobileNavLink } from "../support/navigation";

export interface DashboardNavTreatmentFlowOptions {
	/** Pause between steps — use in `.demo.ts` recordings only. */
	stepDelayMs?: number;
	/** When true, stop on Treatments after creating (e2e asserts before return Home). */
	stopBeforeReturnHome?: boolean;
}

/**
 * Home → Treatments → add treatment → Home.
 * Shared by e2e specs (with assertions) and demo recordings (with pacing).
 */
export async function runDashboardNavTreatmentFlow(
	page: Page,
	options: DashboardNavTreatmentFlowOptions = {},
) {
	const pause = async () => {
		if (options.stepDelayMs) {
			await page.waitForTimeout(options.stepDelayMs);
		}
	};

	await page.goto("/en");
	await pause();
	await clickMobileNavLink(page, "Treatments");
	await pause();
	await addTreatmentFromDialog(page);
	await pause();

	if (!options.stopBeforeReturnHome) {
		await clickMobileNavLink(page, "Home");
		await pause();
	}
}
