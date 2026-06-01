import { test } from "@playwright/test";
import { goToParcelsAndAddParcel } from "./flows/dashboard-nav-parcel";
import { expectDashboardLoaded } from "./support/assertions";
import { clickMobileNavLink } from "./support/navigation";

test.describe.configure({ mode: "serial" });

test("adds parcel via nav and returns to dashboard without loading skeleton", async ({
	page,
}) => {
	await page.goto("/en");
	await expectDashboardLoaded(page);

	await goToParcelsAndAddParcel(page);

	await clickMobileNavLink(page, "Home");
	await expectDashboardLoaded(page);
});
