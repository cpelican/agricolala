import type { Page } from "@playwright/test";

/** Bottom nav sits under the Next.js dev error overlay in `next dev`; force avoids flake. */
export async function clickMobileNavLink(page: Page, name: string) {
	await page
		.getByRole("navigation")
		.getByRole("link", { name })
		.click({ force: true });
}
