import { expect, test } from "./support/test";
import {
	seedE2eDataWithSharedParcel,
	seededParcel,
	sharedParcel,
	sharedParcelOwner,
} from "./support/e2e-data";
import { expectNoVisibleErrors } from "./support/assertions";

test.describe.configure({ mode: "serial" });

test.beforeEach(async () => {
	await seedE2eDataWithSharedParcel();
});

test("a parcel shared by another grower is listed with their treatments", async ({
	page,
}) => {
	await page.goto("/en/parcels");
	await expectNoVisibleErrors(page);
	const main = page.getByRole("main");
	await expect(main.getByText(sharedParcel.name).first()).toBeVisible();
	await expect(main.getByText(seededParcel.name).first()).toBeVisible();

	await page.goto("/en/treatments");
	await expectNoVisibleErrors(page);
	await expect(
		main.getByText(`By ${sharedParcelOwner.name}`, { exact: true }),
	).toHaveCount(1);
	// Own treatments can be deleted; the other grower's cannot (D2).
	await expect(
		main.getByRole("button", { name: `on ${seededParcel.name}` }).first(),
	).toBeVisible();
	await expect(
		main.getByRole("button", { name: `on ${sharedParcel.name}` }),
	).toHaveCount(0);
});
