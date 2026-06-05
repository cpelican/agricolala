import { expect, type Page } from "@playwright/test";

const missingParcelId = "clzzzzzzzzzzzzzzzzzzzzzzzzz";

export function missingParcelPath() {
	return `/en/parcels/${missingParcelId}`;
}

export async function expectSignInPage(page: Page) {
	await expect(page).toHaveURL(/\/auth\/signin/);
	await expect(page.getByPlaceholder("Email")).toBeVisible();
	await expect(
		page.getByRole("button", { name: "Sign in with credentials" }),
	).toBeVisible();
}

export async function expectNotFoundPage(page: Page) {
	await expect(
		page.getByRole("heading", { name: "Page not found" }),
	).toBeVisible();
	await expect(
		page.getByText("The page you're looking for doesn't exist or was removed."),
	).toBeVisible();
	await expect(page.getByRole("link", { name: "Back to home" })).toBeVisible();
}
