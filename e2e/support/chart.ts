import { expect, type Locator } from "@playwright/test";

export interface ChartDatasetSummary {
	label: string;
	data: (number | null)[];
}

export interface ChartSummary {
	labels: string[];
	datasets: ChartDatasetSummary[];
}

export function getDashboardChart(main: Locator) {
	return main.getByRole("figure", {
		name: "Monthly pure active substance (kg)",
	});
}

export async function getChartSummary(chart: Locator) {
	const chartSummary = await chart.getAttribute("data-chart-summary");
	expect(chartSummary).not.toBeNull();
	return JSON.parse(chartSummary ?? "{}") as ChartSummary;
}

export function getDataset(summary: ChartSummary, label: string) {
	return summary.datasets.find((dataset) => dataset.label === label);
}

export function getCopperDataset(summary: ChartSummary) {
	return getDataset(summary, "Copper");
}
