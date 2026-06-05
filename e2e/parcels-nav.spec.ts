import { runDashboardNavParcelFlow } from "./flows/dashboard-nav-parcel";
import { seedE2eData } from "./support/e2e-data";
import { test } from "./support/test";

test.describe.configure({ mode: "serial" });

test("adds parcel via nav and returns to dashboard without loading skeleton", async ({
	page,
}) => {
	await seedE2eData();
	await runDashboardNavParcelFlow(page);
});
