import { expect, test } from "./support/test";
import { goToTreatmentsAndAddTreatment } from "./flows/dashboard-nav-treatment";
import {
	getChartSummary,
	getCopperDataset,
	getDashboardChart,
	getDataset,
} from "./support/chart";
import {
	additionalTreatmentOrangeOilMl,
	expectedCopperChartKg,
	expectedCopperChartKgAfterAdditionalTreatment,
	expectedDashboardCopperLabelsAfterAdditionalTreatment,
	expectedDashboardOrangeOilLabelsAfterTreatment,
	expectedOrangeOilChartTotalKg,
	orangeOilProduct,
} from "./support/e2e-data";
import { expectDashboardLoaded } from "./support/assertions";
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
	expect(getCopperDataset(summaryBefore)?.data).toEqual(
		expectedCopperChartKg(),
	);

	await goToTreatmentsAndAddTreatment(page);

	await clickMobileNavLink(page, "Home");
	await expectDashboardLoaded(page);

	const summaryAfter = await getChartSummary(chart);
	expect(getCopperDataset(summaryAfter)?.data).toEqual(
		expectedCopperChartKgAfterAdditionalTreatment(),
	);

	const labels = expectedDashboardCopperLabelsAfterAdditionalTreatment();
	await expect(
		main.getByText("Product applied", { exact: true }),
	).toBeVisible();
	await expect(
		main.getByText(labels.productValue, { exact: true }),
	).toBeVisible();
	await expect(
		main.getByText("Active substance", { exact: true }),
	).toBeVisible();
	await expect(
		main.getByText(labels.activeSubstanceValue, { exact: true }),
	).toBeVisible();
});

test("adds liquid product in ml and converts to grams of pure substance", async ({
	page,
}) => {
	await goToTreatmentsAndAddTreatment(page, {
		productName: orangeOilProduct.name,
		dose: additionalTreatmentOrangeOilMl,
		expectedUnit: "ml",
	});

	await clickMobileNavLink(page, "Home");
	await expectDashboardLoaded(page);

	const main = page.getByRole("main");
	const summary = await getChartSummary(getDashboardChart(main));
	// Sum over months so the check does not depend on the run date.
	const orangeOilKg =
		getDataset(summary, orangeOilProduct.substanceName)?.data ?? [];
	expect(
		orangeOilKg.reduce<number>((sum, kg) => sum + (kg ?? 0), 0),
	).toBeCloseTo(expectedOrangeOilChartTotalKg);
	// Copper untouched by the orange oil treatment.
	expect(getCopperDataset(summary)?.data).toEqual(expectedCopperChartKg());

	// 100 ml → 90 g of product; 20% of it → 18 g pure, i.e. 450 g/ha on 400 m².
	const labels = expectedDashboardOrangeOilLabelsAfterTreatment();
	await expect(
		main.getByRole("heading", { name: orangeOilProduct.substanceLabel }),
	).toBeVisible();
	await expect(
		main.getByText(labels.productValue, { exact: true }),
	).toBeVisible();
	await expect(
		main.getByText(labels.activeSubstanceValue, { exact: true }),
	).toBeVisible();
});
