import { defineConfig } from "@playwright/test";
import { authStatePath } from "./e2e/support/e2e-data";
import { mobileUse } from "./e2e/support/playwright-mobile";

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3002";
const serverUrl = new URL(baseURL);
const port = serverUrl.port || "3002";

process.env.DATABASE_URL ??=
	"postgresql://agraria:agraria@localhost:5434/agraria?schema=public";
process.env.DIRECT_URL ??= process.env.DATABASE_URL;
process.env.NEXTAUTH_SECRET ??= "playwright-local-secret";
process.env.NEXTAUTH_URL ??= baseURL;
process.env.TEST_USER_EMAIL ??= "playwright@agricolala.test";
process.env.TEST_USER_PASSWORD ??= "playwright-local-password";

const recordDemo = process.env.PLAYWRIGHT_RECORD_DEMO === "1";

export default defineConfig({
	testDir: "./e2e",
	globalTeardown: "./e2e/global-teardown.ts",
	fullyParallel: false,
	workers: 1,
	timeout: 45_000,
	expect: {
		timeout: 10_000,
	},
	use: {
		...mobileUse,
		baseURL,
		storageState: authStatePath,
		trace: "retain-on-failure",
		screenshot: "only-on-failure",
		video: recordDemo ? "on" : "retain-on-failure",
	},
	webServer: {
		command: `npm run dev -- --hostname ${serverUrl.hostname} --port ${port}`,
		url: `${baseURL}/api/health`,
		reuseExistingServer: !process.env.CI,
		timeout: 120_000,
		env: {
			...process.env,
			PLAYWRIGHT: "1",
		},
	},
	projects: [
		{
			name: "setup",
			testMatch: /auth\.setup\.ts/,
		},
		{
			name: "mobile-chromium",
			testMatch: /.*\.spec\.ts$/,
			dependencies: ["setup"],
		},
	],
});
