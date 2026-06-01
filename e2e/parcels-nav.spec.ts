import { runDashboardNavParcelFlow } from "./flows/dashboard-nav-parcel";
import { test } from "./support/test";

test.describe.configure({ mode: "serial" });

test("adds parcel via nav and returns to dashboard without loading skeleton", async ({
	page,
}) => {
	await runDashboardNavParcelFlow(page);
});
