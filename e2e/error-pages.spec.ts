import { seedE2eData, invalidateE2eUserSession } from "./support/e2e-data";
import {
	expectNotFoundPage,
	expectSignInPage,
	missingParcelPath,
} from "./support/error-pages";
import { mobileUse } from "./support/playwright-mobile";
import { test } from "./support/test";

test.describe.configure({ mode: "serial" });

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

test("redirects stale session to sign-in", async ({ page }) => {
	await invalidateE2eUserSession();
	await page.goto("/en");
	await expectSignInPage(page);
	await seedE2eData();
});
