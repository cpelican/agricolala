import { expect, test } from "./support/test";
import { goToTreatmentsAndAddTreatment } from "./flows/dashboard-nav-treatment";
import {
	additionalTreatmentProductGrams,
	seededParcel,
} from "./support/e2e-data";
import { clickMobileNavLink } from "./support/navigation";

test.describe.configure({ mode: "serial" });

test("stage picked in the treatment modal is suggested, not saved, next time", async ({
	page,
}) => {
	await goToTreatmentsAndAddTreatment(page, {
		productName: "Pasta cafaro",
		dose: additionalTreatmentProductGrams,
		expectedUnit: "g",
		stageLabel: "Small berries",
	});

	await page.getByRole("button", { name: "Add Treatment" }).click();
	const dialog = page.getByRole("dialog", { name: "Add Treatment" });
	await expect(dialog).toBeVisible();
	// No parcel selected yet: nothing to suggest.
	await expect(dialog.getByRole("radio", { checked: true })).toHaveCount(0);

	await dialog.getByText("Select parcel").click();
	await page
		.getByRole("option", { name: new RegExp(seededParcel.name) })
		.click();
	await expect(
		dialog.getByText("Suggested: Small berries", { exact: false }),
	).toBeVisible();
	// The suggestion is only highlighted: it is saved only if the grower taps it.
	await expect(dialog.getByRole("radio", { checked: true })).toHaveCount(0);
	await dialog.getByRole("radio", { name: "Small berries" }).click();
	await expect(
		dialog.getByRole("radio", { name: "Small berries" }),
	).toBeChecked();
	await expect(dialog.getByText("Suggested: Small berries")).toBeHidden();
});

test("updates the stage from the parcel card", async ({ page }) => {
	await page.goto("/en");
	await clickMobileNavLink(page, "Parcels");
	await expect(page.getByRole("heading", { name: "Parcels" })).toBeVisible();

	const main = page.getByRole("main");
	await expect(main.getByText("Stage unknown")).toBeVisible();
	await main.getByRole("button", { name: "Update stage" }).click();

	const dialog = page.getByRole("dialog", { name: "Update stage" });
	await expect(dialog).toBeVisible();
	await dialog.getByRole("radio", { name: "Flowering" }).click();
	await dialog.getByRole("button", { name: "Save" }).click();
	await expect(dialog).toBeHidden();

	await expect(page.getByText("Stage updated", { exact: true })).toBeVisible();
	await expect(main.getByText("Flowering", { exact: true })).toBeVisible();
	await expect(main.getByText("Stage unknown")).toBeHidden();

	// The pill marks the next stage after a confirmation showing its description.
	await main.getByRole("button", { name: "Mark Small berries" }).click();
	const confirm = page.getByRole("dialog", { name: "Mark Small berries?" });
	await expect(confirm.getByText("Berries set, up to pea size")).toBeVisible();
	await confirm.getByRole("button", { name: "Confirm" }).click();
	await expect(confirm).toBeHidden();
	await expect(main.getByText("Small berries", { exact: true })).toBeVisible();
	await expect(
		main.getByRole("button", { name: "Mark Bunch closing" }),
	).toBeVisible();
});

test("marks a stage from the parcel detail tiles", async ({ page }) => {
	await page.goto("/en/parcels");
	await page
		.getByRole("main")
		.getByRole("link", { name: new RegExp(seededParcel.name) })
		.click();

	const main = page.getByRole("main");
	await expect(main.getByText("Growth stage")).toBeVisible();
	const tile = main.getByRole("button", { name: "Mark Colour change" });
	await expect(tile).toHaveAttribute("aria-pressed", "false");
	await tile.click();

	// Cancel leaves the stage unchanged.
	const confirm = page.getByRole("dialog", { name: "Mark Colour change?" });
	await expect(
		confirm.getByText("Berries soften and change colour"),
	).toBeVisible();
	await confirm.getByRole("button", { name: "Cancel" }).click();
	await expect(confirm).toBeHidden();
	await expect(tile).toHaveAttribute("aria-pressed", "false");

	await tile.click();
	await confirm.getByRole("button", { name: "Confirm" }).click();
	await expect(page.getByText("Stage updated", { exact: true })).toBeVisible();
	await expect(tile).toHaveAttribute("aria-pressed", "true");
	await expect(main.getByText("Set today")).toBeVisible();
});
