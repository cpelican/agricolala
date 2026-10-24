import { e2eUser, revokeE2eUserAccess } from "./support/e2e-data";
import { expect, test } from "./support/test";

test("explains how to ask for access while an account is not open yet", async ({
	page,
}) => {
	await revokeE2eUserAccess();
	await page.goto("/en");

	const main = page.getByRole("main");
	await expect(
		main.getByRole("heading", { level: 1, name: "Almost there!" }),
	).toBeVisible();
	await expect(main.getByText(e2eUser.email)).toBeVisible();

	const request = main.getByRole("link", {
		name: "Request access on GitHub (opens in a new tab)",
	});
	await expect(request).toHaveAttribute(
		"href",
		/^https:\/\/github\.com\/cpelican\/agricolala\/issues\/new\?/,
	);
	// The issue is public: it carries the account code shown on screen, never the email.
	const accountCode = await main.locator("code").innerText();
	expect(accountCode).toMatch(/^\w{8}$/);
	const issue = new URL((await request.getAttribute("href")) ?? "");
	expect(issue.searchParams.get("body")).toContain(accountCode);
	expect(issue.toString()).not.toContain(encodeURIComponent(e2eUser.email));
	expect(issue.searchParams.get("body")).not.toContain(e2eUser.email);

	await expect(main.getByRole("button", { name: "Sign Out" })).toBeVisible();
	// The app itself stays out of reach.
	await expect(page.getByRole("link", { name: "Parcels" })).toHaveCount(0);
});
