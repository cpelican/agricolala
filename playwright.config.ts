import { defineConfig, devices } from "@playwright/test";

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

export default defineConfig({
	testDir: "./e2e",
	fullyParallel: false,
	timeout: 45_000,
	expect: {
		timeout: 10_000,
	},
	use: {
		baseURL,
		trace: "retain-on-failure",
		screenshot: "only-on-failure",
	},
	webServer: {
		command: `npm run dev -- --hostname ${serverUrl.hostname} --port ${port}`,
		url: `${baseURL}/api/health`,
		reuseExistingServer: !process.env.CI,
		timeout: 120_000,
	},
	projects: [
		{
			name: "chromium",
			use: { ...devices["Desktop Chrome"] },
		},
	],
});
