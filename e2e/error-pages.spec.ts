import {
	expectNotFoundPage,
	expectSignInPage,
	missingParcelPath,
} from "./support/error-pages";
import { mobileUse } from "./support/playwright-mobile";
import { test } from "./support/test";

test("redirects unauthenticated users to sign-in", async ({ browser }) => {
	const guestContext = await browser.newContext({
		...mobileUse,
		storageState: { cookies: [], origins: [] },
	});
	const guestPage = await guestContext.newPage();

	await guestPage.goto("/en/parcels");
	await expectSignInPage(guestPage);
	await guestContext.close();
});

test("shows not-found page for an unknown parcel", async ({ page }) => {
	await page.goto(missingParcelPath());
	await expectNotFoundPage(page);
});
