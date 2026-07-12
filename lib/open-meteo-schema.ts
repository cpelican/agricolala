import { Errors } from "@/lib/constants";
import type { WeatherHistory } from "@prisma/client";
import { z } from "zod";

const nullableNumberArraySchema = z.array(z.number().nullable());

const openMeteoResponseSchema = z.object({
	hourly: z
		.object({
			time: z.array(z.string()),
			temperature_2m: nullableNumberArraySchema,
			temperature_80m: nullableNumberArraySchema,
			precipitation: nullableNumberArraySchema,
			relative_humidity_2m: nullableNumberArraySchema,
			wind_speed_10m: nullableNumberArraySchema,
			wind_speed_180m: nullableNumberArraySchema,
		})
		.superRefine((hourly, context) => {
			const expectedLength = hourly.time.length;
			const hourlySeries = [
				"temperature_2m",
				"temperature_80m",
				"precipitation",
				"relative_humidity_2m",
				"wind_speed_10m",
				"wind_speed_180m",
			] as const;

			for (const seriesName of hourlySeries) {
				if (hourly[seriesName].length !== expectedLength) {
					context.addIssue({
						code: z.ZodIssueCode.custom,
						message: `${seriesName} length must match time length`,
						path: [seriesName],
					});
				}
			}
		}),
});

export type OpenMeteoResponse = z.infer<typeof openMeteoResponseSchema>;

export interface DailyWeatherData
	extends Pick<
		WeatherHistory,
		| "temperature2mMin"
		| "temperature2mMax"
		| "temperature80mMin"
		| "temperature80mMax"
		| "cumulativePrecipitation"
		| "relative_humidity_2mMin"
		| "relative_humidity_2mMax"
		| "wind_speed_10mMin"
		| "wind_speed_10mMax"
		| "wind_speed_180mMin"
		| "wind_speed_180mMax"
	> {
	date: Date;
}

export const WEATHER_HISTORY_DAYS = 7;
export const WEATHER_FORECAST_DAYS = 3;

// Fail fast rather than hang on a slow/unreachable upstream — well under
// Playwright's default 10s expect timeout and Next.js request lifetime.
export const FETCH_TIMEOUT_MS = 5_000;

export const getStartOfUtcDay = (date: Date) => {
	return new Date(
		Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
	);
};

export const subtractUtcDays = (date: Date, days: number) => {
	const result = new Date(date);
	result.setUTCDate(result.getUTCDate() - days);
	return result;
};

export const parseOpenMeteoResponse = async (
	response: Response,
): Promise<OpenMeteoResponse> => {
	const payload: unknown = await response.json();
	const parsedResponse = openMeteoResponseSchema.safeParse(payload);

	if (!parsedResponse.success) {
		console.error(
			"Open-Meteo response did not match expected schema",
			parsedResponse.error.issues,
		);
		throw new Error(Errors.INTERNAL_SERVER);
	}

	return parsedResponse.data;
};

// `PLAYWRIGHT=1` is set on the e2e webServer (playwright.config.ts). The real
// Open-Meteo API is unreliable from CI runners (503s / connect timeouts),
// which delayed the coverage widget's Suspense boundary past Playwright's
// 10s expect timeout. Mocking is opt-in per call site (see
// `allowPlaywrightMock` below) so it stays scoped to the coverage widget's
// forecast fetch instead of silently changing data for every other caller
// of this client (e.g. the Applicability panel) under e2e.
export const isPlaywrightEnv = () => process.env.PLAYWRIGHT === "1";

export const buildMockOpenMeteoResponse = (days: number): OpenMeteoResponse => {
	const start = getStartOfUtcDay(new Date());
	const time = Array.from({ length: days * 24 }, (_, index) => {
		const date = new Date(start);
		date.setUTCHours(date.getUTCHours() + index);
		return `${date.toISOString().slice(0, 13)}:00Z`;
	});

	return {
		hourly: {
			time,
			temperature_2m: time.map(() => 18),
			temperature_80m: time.map(() => 17),
			precipitation: time.map(() => 0),
			relative_humidity_2m: time.map(() => 60),
			wind_speed_10m: time.map(() => 8),
			wind_speed_180m: time.map(() => 10),
		},
	};
};
