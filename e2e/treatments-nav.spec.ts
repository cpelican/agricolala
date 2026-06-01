import { expect, test } from "@playwright/test";
import { runDashboardNavTreatmentFlow } from "./flows/dashboard-nav-treatment";
import {
	getChartSummary,
	getCopperDataset,
	getDashboardChart,
} from "./support/chart";
import {
	expectedCopperChartKg,
	expectedCopperChartKgAfterAdditionalTreatment,
	expectedDashboardCopperLabelsAfterAdditionalTreatment,
} from "./support/e2e-data";
import {
	expectDashboardLoaded,
	expectNoVisibleErrors,
} from "./support/assertions";
import { clickMobileNavLink } from "./support/navigation";

test.describe.configure({ mode: "serial" });

test("adds treatment via nav and updates dashboard on return home", async ({
	page,
}) => {
	await page.goto("/en");
	await expectDashboardLoaded(page);

	const main = page.getByRole("main");
	const chart = getDashboardChart(main);
	const summaryBefore = await getChartSummary(chart);
	expect(getCopperDataset(summaryBefore)?.data).toEqual([
		...expectedCopperChartKg,
	]);

	await runDashboardNavTreatmentFlow(page, { stopBeforeReturnHome: true });
	await expect(
		page.getByRole("heading", { name: "5 Completed" }),
	).toBeVisible();

	await clickMobileNavLink(page, "Home");
	await expectDashboardLoaded(page);

	const summaryAfter = await getChartSummary(chart);
	expect(getCopperDataset(summaryAfter)?.data).toEqual(
		expectedCopperChartKgAfterAdditionalTreatment(),
	);

	const labels = expectedDashboardCopperLabelsAfterAdditionalTreatment();
	await expect(main.getByText(labels.productText)).toBeVisible();
	await expect(main.getByText(labels.pureText)).toBeVisible();
	await expect(main.getByText(labels.kgHaText)).toBeVisible();
	await expectNoVisibleErrors(page);
});
