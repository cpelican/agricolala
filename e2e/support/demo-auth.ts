import { expect, type Browser } from "@playwright/test";
import {
	authStatePath,
	e2eUser,
	ensureAuthStateDirectory,
	seedE2eData,
} from "./e2e-data";
import { mobileUse } from "./playwright-mobile";

/** Seeds e2e DB and writes fresh `e2e/.auth/user.json` (always re-login after reset). */
export async function ensureE2eAuthState(browser: Browser) {
	await seedE2eData();
	await ensureAuthStateDirectory();

	const context = await browser.newContext({
		...mobileUse,
		storageState: { cookies: [], origins: [] },
	});
	const page = await context.newPage();
	await page.goto("/auth/signin");
	await page.getByPlaceholder("Email").fill(e2eUser.email);
	await page.getByPlaceholder("Password").fill(e2eUser.password);
	await page.getByRole("button", { name: "Sign in with credentials" }).click();
	await page.waitForURL(/\/en(?:$|[/?#])/);
	await expect(page.getByRole("heading", { name: /Welcome/i })).toBeVisible();
	await context.storageState({ path: authStatePath });
	await context.close();
}
