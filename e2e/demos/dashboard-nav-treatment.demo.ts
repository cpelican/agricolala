import { test } from "@playwright/test";
import { runDashboardNavTreatmentFlow } from "../flows/dashboard-nav-treatment";
import { authStatePath } from "../support/e2e-data";
import { saveDemoVideo } from "../support/demo-video";

export const demoSlug = "dashboard-nav-treatment";

test.describe.configure({ mode: "serial" });
test.use({ storageState: authStatePath, video: "on" });

test(demoSlug, async ({ page }) => {
	await runDashboardNavTreatmentFlow(page, { stepDelayMs: 600 });
});

test.afterEach(async ({ page }) => {
	await saveDemoVideo(page, demoSlug);
});
