import {
	getPendingE2eUserAccess,
	pendingE2eUser,
	pendingE2eUserIntroduction,
	seedPendingE2eUser,
} from "./support/e2e-data";
import { expectNotFoundPage } from "./support/error-pages";
import { pendingUserContext } from "./support/pending-user-session";
import { expect, test } from "./support/test";

const adminPath = "/en/admin/access-requests";

test("a new account explains why, takes an introduction and remembers it", async ({
	browser,
	baseURL,
}) => {
	await seedPendingE2eUser();
	const context = await pendingUserContext(browser, baseURL ?? "");
	const page = await context.newPage();
	await page.goto("/en");

	const main = page.getByRole("main");
	await expect(
		main.getByRole("heading", { level: 1, name: "Almost there!" }),
	).toBeVisible();
	await expect(
		main.getByText(/I open every new account by hand/),
	).toBeVisible();
	await expect(main.getByText(pendingE2eUser.email).first()).toBeVisible();
	// Friendly heads-up that requests nobody can trace back to a real person get turned down.
	await expect(
		main.getByRole("heading", { level: 3, name: "What helps me say yes" }),
	).toBeVisible();
	await expect(main.getByText(/gives me nothing to check/)).toBeVisible();

	const introduction = main.getByRole("textbox", {
		name: "A few words about you",
	});
	await expect(introduction).toHaveAccessibleDescription(
		/Between 20 and 1000 characters/,
	);
	const send = main.getByRole("button", { name: "Send my request" });

	await introduction.fill("Hi there");
	await send.click();
	await expect(main.getByRole("alert")).toHaveText(
		"Please write at least 20 characters.",
	);
	await expect(introduction).toHaveValue("Hi there");
	await expect(introduction).toHaveAccessibleDescription(
		/Please write at least 20 characters/,
	);

	await introduction.fill(pendingE2eUserIntroduction);
	await send.click();
	const sent = main.getByRole("heading", {
		level: 2,
		name: /^Request sent on /,
	});
	await expect(sent).toBeFocused();
	await expect(
		main.getByText(
			`You’ll get an email at ${pendingE2eUser.email} as soon as your account is open; then just sign in again.`,
		),
	).toBeVisible();

	await page.reload();
	await expect(sent).toBeVisible();
	await expect(introduction).toHaveCount(0);
	expect((await getPendingE2eUserAccess()).accessRequest?.message).toBe(
		pendingE2eUserIntroduction,
	);

	await expect(main.getByRole("button", { name: "Sign Out" })).toBeVisible();
	// The app itself stays out of reach.
	await expect(page.getByRole("link", { name: "Parcels" })).toHaveCount(0);
	await context.close();
});

test("only admins see the requests page", async ({ page }) => {
	await page.goto(adminPath);
	await expectNotFoundPage(page);
});

test("an admin approves a request in one click and the account opens", async ({
	browser,
	baseURL,
	page,
}) => {
	await seedPendingE2eUser({ withRequest: true });
	const context = await pendingUserContext(browser, baseURL ?? "");
	const pendingPage = await context.newPage();
	await pendingPage.goto("/en");
	await expect(
		pendingPage.getByRole("heading", { name: /^Request sent on / }),
	).toBeVisible();

	await page.goto(adminPath);
	await expect(
		page.getByRole("heading", { level: 1, name: "Access requests" }),
	).toBeVisible();
	const request = page
		.getByRole("listitem")
		.filter({ hasText: pendingE2eUser.email });
	await expect(request.getByText(pendingE2eUserIntroduction)).toBeVisible();

	await request
		.getByRole("button", { name: `Approve ${pendingE2eUser.name}` })
		.click();
	// No Resend key in e2e: the account opens, and the page says the email didn't go.
	const waiting = page.getByRole("region", { name: "Waiting" });
	await expect(waiting.getByRole("status")).toHaveText(
		`Approved ${pendingE2eUser.name}; email not sent.`,
	);
	await expect(waiting.getByText("No requests waiting.")).toBeVisible();
	await expect(
		page
			.getByRole("region", { name: "Recently approved" })
			.getByText(pendingE2eUser.email),
	).toBeVisible();
	expect((await getPendingE2eUserAccess()).isAuthorized).toBe(true);

	// Same session, no new sign-in: the next request reads the open account.
	await pendingPage.reload();
	await expect(
		pendingPage.getByRole("link", { name: "Parcels" }),
	).toBeVisible();
	await expect(
		pendingPage.getByRole("heading", { name: "Almost there!" }),
	).toHaveCount(0);
	await context.close();
});
