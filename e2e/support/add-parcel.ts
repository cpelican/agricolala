import { expect, type Page } from "@playwright/test";
import { parcelLocationMapLabel } from "./map";

export interface AddParcelOptions {
	name?: string;
	widthMeters?: string;
	heightMeters?: string;
	latitude?: string;
	longitude?: string;
	altitude?: string;
	mapClickPosition?: { x: number; y: number };
}

const defaults: Required<AddParcelOptions> = {
	name: "E2E Added Parcel",
	widthMeters: "80",
	heightMeters: "45",
	latitude: "44.135",
	longitude: "9.684",
	altitude: "65",
	mapClickPosition: { x: 220, y: 180 },
};

export async function addParcelFromMapDialog(
	page: Page,
	options: AddParcelOptions = {},
) {
	const parcel = { ...defaults, ...options };

	await page
		.getByRole("application", { name: parcelLocationMapLabel })
		.click({ position: parcel.mapClickPosition });

	const dialog = page.getByRole("dialog", { name: "Add New Parcel" });
	await expect(dialog).toBeVisible();
	await dialog.getByLabel("Parcel Name").fill(parcel.name);
	await dialog.getByLabel("Width (meters)").fill(parcel.widthMeters);
	await dialog.getByLabel("Height (meters)").fill(parcel.heightMeters);
	await dialog.getByLabel("Latitude").fill(parcel.latitude);
	await dialog.getByLabel("Longitude").fill(parcel.longitude);
	await dialog.getByLabel("Altitude").fill(parcel.altitude);

	await dialog.getByRole("button", { name: "Add Parcel" }).click();
	await expect(dialog).toBeHidden();

	return parcel.name;
}
