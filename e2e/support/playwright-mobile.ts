import { devices } from "@playwright/test";

/** Mobile-only viewport for all Playwright runs (matches bottom navigation layout). */
export const mobileDevice = devices["Pixel 5"];

export const mobileUse = {
	...mobileDevice,
	geolocation: { latitude: 44.135, longitude: 9.684 },
	permissions: ["geolocation"] as string[],
};
