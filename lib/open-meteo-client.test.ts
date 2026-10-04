import { afterEach, describe, expect, test, vi } from "vitest";
import {
	OpenMeteoClient,
	type OpenMeteoResponse,
} from "@/lib/open-meteo-client";
import { Errors } from "@/lib/constants";

const createHourlyRange = (startIsoHour: string, hours: number) => {
	const start = new Date(`${startIsoHour}:00Z`);

	return Array.from({ length: hours }, (_, index) => {
		const date = new Date(start);
		date.setUTCHours(start.getUTCHours() + index);
		return `${date.toISOString().slice(0, 13)}:00Z`;
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

const mockOpenMeteoFetch = (response: unknown) => {
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

type FetchOutcome = { status: number; body?: unknown } | Error;

const mockOpenMeteoFetchSequence = (outcomes: FetchOutcome[]) => {
	const fetchMock = vi.fn(async () => {
		const outcome = outcomes.shift();
		if (!outcome) {
			throw new Error("Unexpected extra fetch call");
		}
		if (outcome instanceof Error) {
			throw outcome;
		}
		return new Response(JSON.stringify(outcome.body ?? {}), {
			status: outcome.status,
		});
	});
	vi.stubGlobal("fetch", fetchMock);
	return fetchMock;
};

const timeoutError = () =>
	new DOMException("The operation was aborted due to timeout", "TimeoutError");

describe("OpenMeteoClient", () => {
	afterEach(() => {
		vi.useRealTimers();
		vi.unstubAllGlobals();
		vi.unstubAllEnvs();
		vi.restoreAllMocks();
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
			"2026-06-01T08:00Z",
			"2026-06-01T09:00Z",
			"2026-06-02T00:00Z",
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

	test("only fabricates forecast data under PLAYWRIGHT=1 when the caller opts in", async () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date("2026-06-01T08:16:00Z"));
		vi.stubEnv("PLAYWRIGHT", "1");
		const requestedUrls = mockOpenMeteoFetch(createOpenMeteoResponse([]));

		const mockedData = await OpenMeteoClient.getForecastWeatherData(
			44.0998,
			9.7387,
			{ allowPlaywrightMock: true },
		);
		expect(requestedUrls).toHaveLength(0);
		expect(mockedData.length).toBeGreaterThan(0);

		await OpenMeteoClient.getForecastWeatherData(44.0998, 9.7387);
		expect(requestedUrls).toHaveLength(1);
	});

	test("rejects malformed Open-Meteo payloads before aggregation", async () => {
		vi.spyOn(console, "error").mockImplementation(() => undefined);
		mockOpenMeteoFetch({
			hourly: {
				time: ["2026-05-31T00:00"],
				temperature_80m: [12],
				precipitation: [1],
				relative_humidity_2m: [80],
				wind_speed_10m: [10],
				wind_speed_180m: [12],
			},
		});

		await expect(
			OpenMeteoClient.getHistoryWeatherData(44.0998, 9.7387),
		).rejects.toThrow(Errors.INTERNAL_SERVER);
	});
	describe("retry on transient failures", () => {
		const forecastBody = createOpenMeteoResponse([
			"2026-06-01T09:00Z",
			"2026-06-02T00:00Z",
		]);

		const setup = () => {
			vi.useFakeTimers();
			vi.setSystemTime(new Date("2026-06-01T08:16:00Z"));
			vi.spyOn(console, "warn").mockImplementation(() => undefined);
			vi.spyOn(console, "error").mockImplementation(() => undefined);
		};

		test.each([
			["a timeout", timeoutError()],
			["a network error", new TypeError("fetch failed")],
			["a 503 response", { status: 503 }],
			["a 429 response", { status: 429 }],
		])("succeeds on the second attempt after %s", async (_, firstOutcome) => {
			setup();
			const fetchMock = mockOpenMeteoFetchSequence([
				firstOutcome,
				{ status: 200, body: forecastBody },
			]);

			const promise = OpenMeteoClient.getForecastWeatherData(44.0998, 9.7387);
			await vi.advanceTimersByTimeAsync(500);
			const dailyData = await promise;

			expect(fetchMock).toHaveBeenCalledTimes(2);
			expect(dailyData).toHaveLength(2);
		});

		test("retries history requests too", async () => {
			setup();
			const fetchMock = mockOpenMeteoFetchSequence([
				timeoutError(),
				{ status: 200, body: createOpenMeteoResponse([]) },
			]);

			const promise = OpenMeteoClient.getHistoryWeatherData(44.0998, 9.7387);
			await vi.advanceTimersByTimeAsync(500);
			await promise;

			expect(fetchMock).toHaveBeenCalledTimes(2);
		});

		test("does not retry on a non-429 4xx response", async () => {
			setup();
			const fetchMock = mockOpenMeteoFetchSequence([{ status: 400 }]);

			await expect(
				OpenMeteoClient.getForecastWeatherData(44.0998, 9.7387),
			).rejects.toThrow(Errors.ACCESS_DENIED);
			expect(fetchMock).toHaveBeenCalledTimes(1);
		});

		test("throws when the retry also fails with a 5xx", async () => {
			setup();
			const fetchMock = mockOpenMeteoFetchSequence([
				{ status: 500 },
				{ status: 502 },
			]);

			const assertion = expect(
				OpenMeteoClient.getForecastWeatherData(44.0998, 9.7387),
			).rejects.toThrow(Errors.ACCESS_DENIED);
			await vi.advanceTimersByTimeAsync(500);
			await assertion;
			expect(fetchMock).toHaveBeenCalledTimes(2);
		});

		test("rethrows the timeout when the retry also times out", async () => {
			setup();
			const fetchMock = mockOpenMeteoFetchSequence([
				timeoutError(),
				timeoutError(),
			]);

			const assertion = expect(
				OpenMeteoClient.getForecastWeatherData(44.0998, 9.7387),
			).rejects.toThrow("The operation was aborted due to timeout");
			await vi.advanceTimersByTimeAsync(500);
			await assertion;
			expect(fetchMock).toHaveBeenCalledTimes(2);
		});
	});
});
