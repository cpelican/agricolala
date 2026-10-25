import { mobileUse } from "./support/playwright-mobile";
import { expect, test } from "./support/test";

test("shows the public welcome page to signed-out visitors", async ({
	browser,
}) => {
	const guestContext = await browser.newContext({
		...mobileUse,
		locale: "en-GB",
		storageState: { cookies: [], origins: [] },
	});
	const guestPage = await guestContext.newPage();

	await guestPage.goto("/");
	await expect(guestPage).toHaveURL(/\/en\/welcome$/);
	await expect(
		guestPage.getByRole("heading", {
			level: 1,
			name: /Free vineyard management app\s*Your vineyard’s treatment notebook\./,
		}),
	).toBeVisible();
	await expect(guestPage.getByText("Buds opening")).toBeVisible();
	// The real app comes right after the hero, before the season in detail.
	await expect(
		guestPage.getByRole("main").getByRole("heading", { level: 2 }).first(),
	).toHaveText("Your whole vineyard, in your pocket.");
	await expect(
		guestPage.getByRole("meter", {
			name: "Copper used this year, against the yearly limit",
		}),
	).toHaveAttribute("aria-valuenow", "2.9");

	await guestPage.getByRole("link", { name: "IT Italiano" }).click();
	await expect(guestPage).toHaveURL(/\/it\/welcome$/);
	await expect(guestPage.locator("html")).toHaveAttribute("lang", "it");
	await expect(
		guestPage.getByRole("heading", { level: 1, name: /quaderno di campagna/ }),
	).toBeVisible();

	await guestPage.getByRole("link", { name: "Inizia ora" }).click();
	await expect(guestPage).toHaveURL(/\/auth\/signin/);
	await guestContext.close();
});

test("lets signed-out visitors read the privacy policy", async ({
	browser,
}) => {
	const guestContext = await browser.newContext({
		...mobileUse,
		storageState: { cookies: [], origins: [] },
	});
	const guestPage = await guestContext.newPage();

	await guestPage.goto("/en/welcome");
	await guestPage
		.getByRole("contentinfo")
		.getByRole("link", { name: "Privacy Policy" })
		.click();
	await expect(guestPage).toHaveURL(/\/en\/legal\/privacy-policy$/);
	await expect(
		guestPage.getByRole("heading", { level: 1, name: "Privacy Policy" }),
	).toBeVisible();
	await expect(
		guestPage.getByRole("heading", {
			level: 2,
			name: "1. Information We Collect",
		}),
	).toBeVisible();
	await guestContext.close();
});
