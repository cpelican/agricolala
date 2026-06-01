import { expect, test } from "./support/test";
import {
	getChartSummary,
	getCopperDataset,
	getDashboardChart,
} from "./support/chart";
import { expectedCopperChartKg } from "./support/e2e-data";
import { expectDashboardLoaded } from "./support/assertions";

test.describe.configure({ mode: "serial" });

test("dashboard shows April treatment data in the line chart", async ({
	page,
}) => {
	await page.goto("/en");
	await expectDashboardLoaded(page);

	const main = page.getByRole("main");
	const chart = getDashboardChart(main);
	const summary = await getChartSummary(chart);
	expect(summary.labels).toEqual([
		"Jan",
		"Feb",
		"Mar",
		"Apr",
		"May",
		"Jun",
		"Jul",
		"Aug",
		"Sep",
		"Oct",
		"Nov",
		"Dec",
	]);

	const copperDataset = getCopperDataset(summary);
	expect(copperDataset?.data).toEqual([...expectedCopperChartKg]);
	await expect(main.getByText("256.00 gr of product")).toBeVisible();
	await expect(main.getByText("64 gr of pure active substance")).toBeVisible();
	await expect(
		main.getByText("2 kg/ha of pure active substance"),
	).toBeVisible();
});
