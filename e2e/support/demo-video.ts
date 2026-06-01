import { copyFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import type { Page } from "@playwright/test";

const demoVideosDir = join(process.cwd(), "test-results", "demo-videos");

/** Finalize Playwright video and copy to a stable path for the user to open. */
export async function saveDemoVideo(page: Page, slug: string) {
	const video = page.video();
	await page.close();
	const videoPath = video ? await video.path() : null;
	if (!videoPath) {
		return null;
	}

	mkdirSync(demoVideosDir, { recursive: true });
	const destination = join(demoVideosDir, `${slug}.webm`);
	copyFileSync(videoPath, destination);
	return destination;
}

export function getDemoVideoPath(slug: string) {
	return join(demoVideosDir, `${slug}.webm`);
}
