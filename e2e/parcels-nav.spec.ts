import { expect, test } from "@playwright/test";
import { runDashboardNavParcelFlow } from "./flows/dashboard-nav-parcel";
import {
	expectDashboardLoaded,
	expectNoVisibleErrors,
} from "./support/assertions";
import { clickMobileNavLink } from "./support/navigation";

test.describe.configure({ mode: "serial" });

test("adds parcel via nav and returns to dashboard without loading skeleton", async ({
	page,
}) => {
	await page.goto("/en");
	await expectDashboardLoaded(page);

	const parcelName = await runDashboardNavParcelFlow(page, {
		stopBeforeReturnHome: true,
	});
	await expect(page.getByRole("heading", { name: parcelName })).toBeVisible();
	await expectNoVisibleErrors(page);

	await clickMobileNavLink(page, "Home");
	await expectDashboardLoaded(page);
	await expectNoVisibleErrors(page);
});
