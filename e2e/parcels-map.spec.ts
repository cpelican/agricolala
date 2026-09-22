import {
	seedE2eDataNoParcels,
	seedE2eDataOneParcel,
	seededParcel,
} from "./support/e2e-data";
import {
	addParcelOnMap,
	dismissLocationFailureBanner,
	expectLocationFailureBanner,
	expectNoLocationFailureBanner,
	expectParcelInList,
	goToIdleHome,
	goToParcelsPage,
} from "./support/parcels-map";
import { test } from "./support/test";

test.afterEach(async ({ page }) => {
	await goToIdleHome(page);
});

test("creates first parcel with geolocation enabled and no existing parcels", async ({
	page,
}) => {
	await seedE2eDataNoParcels();
	await goToParcelsPage(page);
	await expectNoLocationFailureBanner(page);

	const parcelName = "E2E Map Geo Enabled";
	await addParcelOnMap(page, parcelName);
	await expectParcelInList(page, parcelName);
});

test.describe("geolocation disabled", () => {
	test.use({
		geolocation: undefined,
		permissions: [],
	});

	test("creates first parcel with geolocation disabled and no existing parcels", async ({
		page,
	}) => {
		await seedE2eDataNoParcels();
		await goToParcelsPage(page);
		await expectLocationFailureBanner(page);
		await dismissLocationFailureBanner(page);

		const parcelName = "E2E Map Geo Disabled";
		await addParcelOnMap(page, parcelName);
		await expectParcelInList(page, parcelName);
	});

	test("creates a second parcel when one already exists", async ({ page }) => {
		await seedE2eDataOneParcel();
		await goToParcelsPage(page);
		await expectNoLocationFailureBanner(page);
		await expectParcelInList(page, seededParcel.name);

		const secondParcelName = "E2E Map Second Parcel";
		await addParcelOnMap(page, secondParcelName);
		await expectParcelInList(page, seededParcel.name);
		await expectParcelInList(page, secondParcelName);
	});
});
