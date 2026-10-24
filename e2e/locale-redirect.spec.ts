import { mobileUse } from "./support/playwright-mobile";
import { expect, test } from "./support/test";

// URLs without a language prefix must land in the language the visitor chose before.

test("sends a signed-in user to the language they picked in their profile", async ({
	page,
}) => {
	await page.goto("/en/profile");
	await page.getByRole("combobox").selectOption("it");
	await expect(page).toHaveURL(/\/it\/profile$/);

	await page.goto("/");
	await expect(page).toHaveURL(/\/it$/);

	await page.goto("/treatments");
	await expect(page).toHaveURL(/\/it\/treatments$/);
});

test("remembers the language a signed-out visitor chose", async ({
	browser,
}) => {
	const guestContext = await browser.newContext({
		...mobileUse,
		locale: "en-GB",
		storageState: { cookies: [], origins: [] },
	});
	const guestPage = await guestContext.newPage();

	await guestPage.goto("/en/welcome");
	await guestPage.getByRole("link", { name: "IT Italiano" }).click();
	await expect(guestPage).toHaveURL(/\/it\/welcome$/);

	await guestPage.goto("/");
	await expect(guestPage).toHaveURL(/\/it\/welcome$/);
	await expect(guestPage.locator("html")).toHaveAttribute("lang", "it");

	await guestPage.goto("/legal/privacy-policy");
	await expect(guestPage).toHaveURL(/\/it\/legal\/privacy-policy$/);
	await guestContext.close();
});

test("falls back to the browser language for a first visit", async ({
	browser,
}) => {
	const guestContext = await browser.newContext({
		...mobileUse,
		locale: "it-IT",
		storageState: { cookies: [], origins: [] },
	});
	const guestPage = await guestContext.newPage();

	await guestPage.goto("/");
	await expect(guestPage).toHaveURL(/\/it\/welcome$/);
	await expect(guestPage.locator("html")).toHaveAttribute("lang", "it");
	await guestContext.close();
});
