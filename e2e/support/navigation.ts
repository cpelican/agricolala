import type { Page } from "@playwright/test";
import { expectNoVisibleErrors } from "./assertions";

export async function clickMobileNavLink(page: Page, name: string) {
	await expectNoVisibleErrors(page);
	await page.getByRole("navigation").getByRole("link", { name }).click();
}
