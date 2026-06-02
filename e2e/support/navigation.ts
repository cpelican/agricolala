import { expect, type Page } from "@playwright/test";
import { expectNoVisibleErrors } from "./assertions";

export async function clickMobileNavLink(page: Page, name: string) {
	await expectNoVisibleErrors(page);
	const link = page.getByRole("navigation").getByRole("link", { name });
	await link.scrollIntoViewIfNeeded();
	await expect(link).toBeVisible();
	await link.click();
}
