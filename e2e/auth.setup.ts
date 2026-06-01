import { test as setup } from "@playwright/test";
import { ensureE2eAuthState } from "./support/demo-auth";

setup("prepare database and auth", async ({ browser }) => {
	await ensureE2eAuthState(browser);
});
