import type { Page } from "@playwright/test";
import { expect, test } from "./support/test";
import { goToTreatmentsAndAddTreatment } from "./flows/dashboard-nav-treatment";
import {
	additionalTreatmentProductGrams,
	seedSeasonWarmth,
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

// Records a stage from the parcel detail tiles (each test starts from a fresh seed,
// with no stage recorded).
async function markStageFromDetail(page: Page, stageLabel: string) {
	await page.goto("/en/parcels");
	await page
		.getByRole("main")
		.getByRole("link", { name: new RegExp(seededParcel.name) })
		.click();
	await page
		.getByRole("main")
		.getByRole("button", { name: `Mark ${stageLabel}` })
		.click();
	await page
		.getByRole("dialog", { name: `Mark ${stageLabel}?` })
		.getByRole("button", { name: "Confirm" })
		.click();
	await expect(page.getByText("Stage updated", { exact: true })).toBeVisible();
}

test("disease risk section shows the stage; substance cards flag its critical period", async ({
	page,
}) => {
	const main = page.getByRole("main");
	const diseaseRisk = main.getByTestId("disease-risk-section");
	// Copper is the first substance card.
	const copperDiseases = main
		.getByTestId("substance-diseases")
		.filter({ visible: true })
		.first();

	// No stage recorded: no disease risk section; the card still names its disease.
	await page.goto("/en");
	await expect(main.getByRole("heading", { name: "Copper" })).toBeVisible();
	await expect(diseaseRisk).toHaveCount(0);
	await expect(copperDiseases.getByText("Downy Mildew")).toBeVisible();

	// Colour change is low risk for both mildews: stage shown, no critical chip.
	await markStageFromDetail(page, "Colour change");
	await page.goto("/en");
	await expect(
		diseaseRisk.getByText("Colour change", { exact: true }).first(),
	).toBeVisible();
	await expect(
		main.getByRole("button", { name: /Critical period/ }),
	).toHaveCount(0);

	await markStageFromDetail(page, "Flowering");
	await page.goto("/en");
	await expect(
		diseaseRisk.getByText("Flowering", { exact: true }),
	).toBeVisible();
	// Copper targets downy mildew, which is very high at flowering.
	const chip = copperDiseases.getByRole("button", { name: /Critical period/ });
	// The badge names the disease; "Critical period" is only in its popover.
	await expect(chip).toContainText("Downy Mildew");
	await expect(chip).not.toContainText("Critical period");
	await expect(copperDiseases.getByText("Experimental")).toBeVisible();
	await chip.click();
	await expect(
		page.getByText("Flowering is a critical period for Downy Mildew", {
			exact: false,
		}),
	).toBeVisible();
	await expect(
		page.getByText("timing varies with grape variety and climate", {
			exact: false,
		}),
	).toBeVisible();
	await page.keyboard.press("Escape");

	// One row per disease, the current stage ringed; tapping it lists each level.
	const downyMildew = diseaseRisk.getByRole("button", {
		name: "Downy Mildew: risk by stage",
	});
	await expect(
		downyMildew.locator('[data-stage="FLOWERING"][data-current="true"]'),
	).toBeVisible();
	await downyMildew.click();
	const rowPopover = page.getByRole("dialog");
	await expect(rowPopover.getByText("Flowering · now")).toBeVisible();
	await expect(rowPopover.getByText("Very high risk").first()).toBeVisible();
});

test("flowering shows the bee reminder and flags copper in the modal", async ({
	page,
}) => {
	await page.goto("/en/treatments");
	await page.getByRole("button", { name: "Add Treatment" }).click();
	const dialog = page.getByRole("dialog", { name: "Add Treatment" });
	await expect(dialog).toBeVisible();
	const reminder = dialog.getByTestId("flowering-reminder");
	await expect(reminder).toHaveCount(0);

	await dialog.getByRole("radio", { name: "Flowering" }).click();
	await expect(reminder).toContainText("Flowering: protect the bees");

	// Copper is best avoided while the vines flower.
	await dialog.getByText("Select product").click();
	await page.getByRole("option", { name: "Pasta cafaro" }).click();
	await expect(
		dialog.getByText("Best avoided during flowering", { exact: false }),
	).toBeVisible();

	await dialog.getByRole("radio", { name: "Small berries" }).click();
	await expect(reminder).toHaveCount(0);
	await expect(
		dialog.getByText("Best avoided during flowering", { exact: false }),
	).toBeHidden();
});

test("spray weather recalls the evening-only rule at flowering", async ({
	page,
}) => {
	await markStageFromDetail(page, "Flowering");
	await page.reload();

	const main = page.getByRole("main");
	await expect(main.getByTestId("applicability-flowering")).toHaveText(
		/2 hours before to 3 hours after sunset/,
	);
});

// Stage estimate from temperature (P5): a sum between the flowering and veraison
// thresholds (1282 and 2528 °C·day) on a parcel last marked at flower clusters.
async function openSeededParcelWithFloweringEstimate(page: Page) {
	const seeded = await seedSeasonWarmth(1900, "FLOWER_CLUSTERS");
	test.skip(!seeded, "No day since 1 March to sum yet");
	await page.goto("/en/parcels");
	await page
		.getByRole("main")
		.getByRole("link", { name: new RegExp(seededParcel.name) })
		.click();
	const prompt = page.getByTestId("stage-estimate-prompt");
	await expect(prompt).toContainText("Have your vines reached flowering?");
	await expect(prompt.getByText("Experimental")).toBeVisible();
	return prompt;
}

test("temperature estimate asks to confirm flowering and records it", async ({
	page,
}) => {
	const prompt = await openSeededParcelWithFloweringEstimate(page);
	await prompt.getByRole("button", { name: "Yes, mark it" }).click();

	await expect(page.getByText("Stage updated", { exact: true })).toBeVisible();
	await expect(
		page.getByRole("main").getByRole("button", { name: "Mark Flowering" }),
	).toHaveAttribute("aria-pressed", "true");
	await expect(prompt).toHaveCount(0);
});

test("'Not yet' hides the temperature estimate on this device", async ({
	page,
}) => {
	const prompt = await openSeededParcelWithFloweringEstimate(page);
	await prompt.getByRole("button", { name: "Not yet" }).click();
	await expect(prompt).toHaveCount(0);

	await page.reload();
	await expect(page.getByRole("main").getByText("Growth stage")).toBeVisible();
	await expect(prompt).toHaveCount(0);
	// Nothing was recorded.
	await expect(
		page.getByRole("main").getByRole("button", { name: "Mark Flowering" }),
	).toHaveAttribute("aria-pressed", "false");
});
