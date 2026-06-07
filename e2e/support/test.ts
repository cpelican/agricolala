import { test as base, expect, type TestInfo } from "@playwright/test";
import { seedE2eData } from "./e2e-data";
import { saveDemoVideo } from "./demo-video";

const recordDemo = process.env.PLAYWRIGHT_RECORD_DEMO === "1";

/** Stable filename slug from `e2e/<name>.spec.ts` (e.g. `treatments-nav`). */
export function demoVideoSlugFromTestInfo(testInfo: TestInfo) {
	const match = testInfo.file.match(/([^/]+)\.spec\.ts$/);
	const fileSlug = match?.[1] ?? "e2e-recording";
	return fileSlug;
}

export const test = base;
export { expect };

test.beforeEach(async () => {
	await seedE2eData();
});

test.afterEach(async ({ page }, testInfo) => {
	if (!recordDemo) {
		return;
	}
	await saveDemoVideo(page, demoVideoSlugFromTestInfo(testInfo));
});
