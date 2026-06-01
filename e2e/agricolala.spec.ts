import { expect, test, type Locator, type Page } from "@playwright/test";
import {
	authStatePath,
	disconnectE2ePrisma,
	e2eUser,
	ensureAuthStateDirectory,
	expectedCopperChartKg,
	seededParcel,
	seedE2eData,
} from "./support/e2e-data";

interface ChartDatasetSummary {
	label: string;
	data: number[];
}

interface ChartSummary {
	labels: string[];
	datasets: ChartDatasetSummary[];
}

const visibleErrorText =
	/failed|invalid credentials|access denied|application error|internal server error|is required|must be/i;

test.describe.configure({ mode: "serial" });
test.use({ storageState: authStatePath });

test.beforeAll(async ({ browser }) => {
	await seedE2eData();
	await ensureAuthStateDirectory();

	const context = await browser.newContext({
		storageState: { cookies: [], origins: [] },
	});
	const page = await context.newPage();
	await page.goto("/auth/signin");
	await page.getByPlaceholder("Email").fill(e2eUser.email);
	await page.getByPlaceholder("Password").fill(e2eUser.password);
	await page.getByRole("button", { name: "Sign in with credentials" }).click();
	await page.waitForURL(/\/en(?:$|[/?#])/);
	await expect(page.getByRole("heading", { name: /Welcome/i })).toBeVisible();
	await expectNoVisibleErrors(page);
	await context.storageState({ path: authStatePath });
	await context.close();
});

test.afterAll(async () => {
	await disconnectE2ePrisma();
});

test("dashboard shows April treatment data in the line chart", async ({
	page,
}) => {
	await page.goto("/en");
	await expect(page.getByRole("heading", { name: /Welcome/i })).toBeVisible();
	await expectNoVisibleErrors(page);

	const main = page.getByRole("main");
	const chart = main.getByRole("figure", {
		name: "Monthly pure active substance (kg)",
	});
	await expect(chart).toBeVisible();

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

	const copperDataset = summary.datasets.find(
		(dataset) => dataset.label === "Copper",
	);
	expect(copperDataset?.data).toEqual([...expectedCopperChartKg]);
	await expect(main.getByText("256.00 gr of product")).toBeVisible();
	await expect(main.getByText("64 gr of pure active substance")).toBeVisible();
	await expect(
		main.getByText("2 kg/ha of pure active substance"),
	).toBeVisible();
	await expectNoVisibleErrors(page);
});

test("adds a parcel without visible errors", async ({ page }) => {
	await page.goto("/en/parcels");
	await expect(page.getByRole("heading", { name: "Parcels" })).toBeVisible();
	await expectNoVisibleErrors(page);

	await page
		.getByRole("main")
		.locator(".leaflet-container")
		.last()
		.click({ position: { x: 220, y: 180 } });

	const dialog = page.getByRole("dialog", { name: "Add New Parcel" });
	await expect(dialog).toBeVisible();
	await dialog.getByLabel("Parcel Name").fill("E2E Added Parcel");
	await dialog.getByLabel("Width (meters)").fill("80");
	await dialog.getByLabel("Height (meters)").fill("45");
	await dialog.getByLabel("Latitude").fill("44.135");
	await dialog.getByLabel("Longitude").fill("9.684");
	await dialog.getByLabel("Altitude").fill("65");
	await expectNoVisibleErrors(page);

	await dialog.getByRole("button", { name: "Add Parcel" }).click();
	await expect(dialog).toBeHidden();
	await expect(
		page.getByRole("heading", { name: "E2E Added Parcel" }),
	).toBeVisible();
	await expectNoVisibleErrors(page);
});

test("adds a treatment without visible errors", async ({ page }) => {
	await page.goto("/en/treatments");
	await expect(page.getByRole("heading", { name: "Treatments" })).toBeVisible();
	await expectNoVisibleErrors(page);

	await page.getByRole("button", { name: "Add Treatment" }).click();

	const dialog = page.getByRole("dialog", { name: "Add Treatment" });
	await expect(dialog).toBeVisible();
	await dialog.getByText("Select parcel").click();
	await page
		.getByRole("option", {
			name: new RegExp(seededParcel.name),
		})
		.click();
	await dialog.getByText("Select disease").click();
	await page.getByRole("option", { name: "Peronospora" }).click();
	await dialog.getByText("Select product").click();
	await page.getByRole("option", { name: "Pasta cafaro" }).click();
	await dialog.getByPlaceholder("gr").fill("50");
	await expectNoVisibleErrors(page);

	await dialog.getByRole("button", { name: "Create Treatment" }).click();
	await expect(dialog).toBeHidden();
	await expect(
		page.getByRole("heading", { name: "5 Completed" }),
	).toBeVisible();
	await expectNoVisibleErrors(page);
});

async function expectNoVisibleErrors(page: Page) {
	await expect(page.getByText(visibleErrorText)).toHaveCount(0);
	await expect(page.locator("[data-nextjs-dialog-overlay]")).toHaveCount(0);
}

async function getChartSummary(chart: Locator) {
	const chartSummary = await chart.getAttribute("data-chart-summary");
	expect(chartSummary).not.toBeNull();
	return JSON.parse(chartSummary ?? "{}") as ChartSummary;
}
