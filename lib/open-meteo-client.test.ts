import { afterEach, describe, expect, test, vi } from "vitest";
import {
	OpenMeteoClient,
	type OpenMeteoResponse,
} from "@/lib/open-meteo-client";

const createHourlyRange = (startIsoHour: string, hours: number) => {
	const start = new Date(`${startIsoHour}:00Z`);

	return Array.from({ length: hours }, (_, index) => {
		const date = new Date(start);
		date.setUTCHours(start.getUTCHours() + index);
		return date.toISOString().slice(0, 13) + ":00";
	});
};

const createOpenMeteoResponse = (timestamps: string[]): OpenMeteoResponse => ({
	hourly: {
		time: timestamps,
		temperature_2m: timestamps.map((_, index) => index),
		temperature_80m: timestamps.map((_, index) => index),
		precipitation: timestamps.map(() => 1),
		relative_humidity_2m: timestamps.map(() => 80),
		wind_speed_10m: timestamps.map(() => 10),
		wind_speed_180m: timestamps.map(() => 12),
	},
});

const mockOpenMeteoFetch = (response: OpenMeteoResponse) => {
	const requestedUrls: string[] = [];
	const fetchMock = vi.fn(async (url: string | URL | Request) => {
		requestedUrls.push(url.toString());
		return {
			ok: true,
			json: async () => response,
		} as Response;
	});

	vi.stubGlobal("fetch", fetchMock);

	return requestedUrls;
};

describe("OpenMeteoClient", () => {
	afterEach(() => {
		vi.useRealTimers();
		vi.unstubAllGlobals();
	});

	test("stores only seven complete past days for history", async () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date("2026-06-01T08:16:00Z"));

		const timestamps = [
			...createHourlyRange("2026-05-24T23", 1),
			...createHourlyRange("2026-05-25T00", 24 * 7),
			...createHourlyRange("2026-06-01T00", 9),
		];
		const requestedUrls = mockOpenMeteoFetch(
			createOpenMeteoResponse(timestamps),
		);

		const dailyData = await OpenMeteoClient.getHistoryWeatherData(
			44.0998,
			9.7387,
		);
		const requestedUrlValue = requestedUrls[0];
		expect(requestedUrlValue).toBeDefined();
		const requestedUrl = new URL(requestedUrlValue!);

		expect(requestedUrl.searchParams.get("past_days")).toBe("7");
		expect(requestedUrl.searchParams.get("forecast_days")).toBe("0");
		expect(dailyData.map((day) => day.date.toISOString().slice(0, 10))).toEqual(
			[
				"2026-05-25",
				"2026-05-26",
				"2026-05-27",
				"2026-05-28",
				"2026-05-29",
				"2026-05-30",
				"2026-05-31",
			],
		);
		expect(dailyData.map((day) => day.cumulativePrecipitation)).toEqual([
			24, 24, 24, 24, 24, 24, 24,
		]);
	});

	test("returns only future forecast hours for user-facing guidance", async () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date("2026-06-01T08:16:00Z"));

		const timestamps = [
			"2026-06-01T08:00",
			"2026-06-01T09:00",
			"2026-06-02T00:00",
		];
		const requestedUrls = mockOpenMeteoFetch(
			createOpenMeteoResponse(timestamps),
		);

		const dailyData = await OpenMeteoClient.getForecastWeatherData(
			44.0998,
			9.7387,
		);
		const requestedUrlValue = requestedUrls[0];
		expect(requestedUrlValue).toBeDefined();
		const requestedUrl = new URL(requestedUrlValue!);

		expect(requestedUrl.searchParams.get("forecast_days")).toBe("3");
		expect(dailyData.map((day) => day.date.toISOString().slice(0, 10))).toEqual(
			["2026-06-01", "2026-06-02"],
		);
		expect(dailyData.map((day) => day.cumulativePrecipitation)).toEqual([1, 1]);
	});
});
