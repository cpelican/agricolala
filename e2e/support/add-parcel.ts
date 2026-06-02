import { expect, type Page } from "@playwright/test";
import { parcelLocationMapLabel } from "./map";

export interface AddParcelOptions {
	name?: string;
	altitude?: string;
	mapClickPositions?: { x: number; y: number }[];
}

/** Wide triangle for satellite draw zoom ~19 (~50–250 m² at typical latitudes). */
const defaultTriangle: { x: number; y: number }[] = [
	{ x: 50, y: 50 },
	{ x: 350, y: 50 },
	{ x: 200, y: 340 },
];

const defaults: Required<AddParcelOptions> = {
	name: "E2E Added Parcel",
	altitude: "65",
	mapClickPositions: defaultTriangle,
};

export async function addParcelFromMapDialog(
	page: Page,
	options: AddParcelOptions = {},
) {
	const parcel = { ...defaults, ...options };
	const map = page.getByRole("application", { name: parcelLocationMapLabel });

	await expect(map).toBeVisible();

	await page.getByRole("button", { name: "Draw parcel" }).first().click();
	await expect(page.getByRole("button", { name: "Finish" })).toBeVisible();

	for (const position of parcel.mapClickPositions) {
		await map.click({ position, force: true });
	}

	const finishButton = page.getByRole("button", { name: "Finish" });
	await expect(finishButton).toBeEnabled({ timeout: 10_000 });
	await finishButton.click();

	const dialog = page.getByRole("dialog", { name: "Add New Parcel" });
	await expect(dialog).toBeVisible();
	await expect(dialog.getByText("Calculated area")).toBeVisible();
	await dialog.getByLabel("Parcel Name").fill(parcel.name);
	if (parcel.altitude) {
		await dialog.getByLabel("Altitude").fill(parcel.altitude);
	}

	await dialog.getByRole("button", { name: "Add Parcel" }).click();
	await expect(dialog).toBeHidden();

	return parcel.name;
}
