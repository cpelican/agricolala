import { expect, type Browser, type Page } from "@playwright/test";
import { seedE2eData, invalidateE2eUserSession } from "../support/e2e-data";
import {
	expectNotFoundPage,
	expectSignInPage,
	missingParcelPath,
} from "../support/error-pages";
import { mobileUse } from "../support/playwright-mobile";

/** Guest redirect → 404 → stale-session redirect (for demo video and regression). */
export async function runErrorPagesWalkthrough(
	browser: Browser,
	authenticatedPage: Page,
) {
	const guestContext = await browser.newContext({
		...mobileUse,
		storageState: { cookies: [], origins: [] },
	});
	const guestPage = await guestContext.newPage();

	await guestPage.goto("/en/parcels");
	await expectSignInPage(guestPage);
	await guestContext.close();

	await authenticatedPage.goto(missingParcelPath());
	await expectNotFoundPage(authenticatedPage);

	await invalidateE2eUserSession();
	await authenticatedPage.goto("/en");
	await expectSignInPage(authenticatedPage);

	await seedE2eData();
	await expect(authenticatedPage.getByPlaceholder("Email")).toBeVisible();
}
