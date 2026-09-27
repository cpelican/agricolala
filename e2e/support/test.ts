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

// Auto fixtures, not top-level beforeEach/afterEach: hooks declared in a shared
// module only attach to the first spec file that imports it in a worker, so
// later files would skip the DB reset and see leftover treatments.
export const test = base.extend<{ resetE2eDb: void; demoVideo: void }>({
	resetE2eDb: [
		async ({}, use) => {
			await seedE2eData();
			await use();
		},
		{ auto: true },
	],
	demoVideo: [
		async ({ page }, use, testInfo) => {
			await use();
			if (recordDemo) {
				await saveDemoVideo(page, demoVideoSlugFromTestInfo(testInfo));
			}
		},
		{ auto: true },
	],
});
export { expect };
