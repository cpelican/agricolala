import { expect, type Page } from "@playwright/test";
import { getDashboardChart } from "./chart";

const visibleErrorText =
	/failed|invalid credentials|access denied|application error|internal server error|is required|must be/i;

/** No user-visible error copy and no Next.js dev error overlay (must pass before interactions). */
export async function expectNoVisibleErrors(page: Page) {
	await expect(page.getByText(visibleErrorText)).toHaveCount(0);
	await expect(page.locator("[data-nextjs-dialog-overlay]")).toHaveCount(0);
	await expect(page.locator("nextjs-portal:visible")).toHaveCount(0);
}

/** Dashboard with chart content (not empty-state), no home loading skeleton. */
export async function expectDashboardLoaded(page: Page) {
	await expectNoVisibleErrors(page);
	await expect(page.getByRole("heading", { name: /Welcome/i })).toBeVisible();
	await expect(
		page.getByRole("status", { name: /loading dashboard/i }),
	).toHaveCount(0);

	const main = page.getByRole("main");
	await expect(getDashboardChart(main)).toBeVisible();
	await expect(main.getByText("Substance Usage This Year")).toBeVisible();
}
