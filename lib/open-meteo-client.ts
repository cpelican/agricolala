import { Errors } from "@/lib/constants";
import { type WeatherHistory } from "@prisma/client";
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

interface DailyWeatherData
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

const WEATHER_HISTORY_DAYS = 7;
const WEATHER_FORECAST_DAYS = 3;

const getStartOfUtcDay = (date: Date) => {
	return new Date(
		Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
	);
};

const subtractUtcDays = (date: Date, days: number) => {
	const result = new Date(date);
	result.setUTCDate(result.getUTCDate() - days);
	return result;
};

const parseOpenMeteoResponse = async (
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

export class OpenMeteoClient {
	private static fetchWeatherData = async (
		latitude: number,
		longitude: number,
	): Promise<OpenMeteoResponse> => {
		const url = new URL("https://api.open-meteo.com/v1/forecast");
		url.searchParams.set("latitude", latitude.toString());
		url.searchParams.set("longitude", longitude.toString());
		url.searchParams.set(
			"hourly",
			"precipitation,temperature_2m,temperature_80m,wind_speed_10m,wind_speed_180m,relative_humidity_2m,evapotranspiration",
		);
		url.searchParams.set("past_days", WEATHER_HISTORY_DAYS.toString());
		url.searchParams.set("forecast_days", "0");

		const response = await fetch(url.toString());
		if (!response.ok) {
			console.error(`Failed to fetch weather data: ${response.statusText}`);
			throw new Error(Errors.ACCESS_DENIED);
		}

		return parseOpenMeteoResponse(response);
	};

	private static fetchWeatherForecast = async (
		latitude: number,
		longitude: number,
	): Promise<OpenMeteoResponse> => {
		const url = new URL("https://api.open-meteo.com/v1/forecast");
		url.searchParams.set("latitude", latitude.toString());
		url.searchParams.set("longitude", longitude.toString());
		url.searchParams.set(
			"hourly",
			"precipitation,temperature_2m,temperature_80m,wind_speed_10m,wind_speed_180m,relative_humidity_2m,evapotranspiration",
		);
		url.searchParams.set("forecast_days", WEATHER_FORECAST_DAYS.toString());
		const response = await fetch(url.toString());
		if (!response.ok) {
			console.error(`Failed to fetch weather forecast: ${response.statusText}`);
			throw new Error(Errors.ACCESS_DENIED);
		}
		return parseOpenMeteoResponse(response);
	};

	public static computeDailyWeatherData = (
		hourlyData: OpenMeteoResponse["hourly"],
		skipConditions: (dateTime: Date) => boolean,
	): DailyWeatherData[] => {
		const dailyMap = new Map<string, DailyWeatherData>();
		for (let i = 0; i < hourlyData.time.length; i++) {
			const timestamp = hourlyData.time[i];
			const dateTime = new Date(timestamp);

			if (skipConditions(dateTime)) {
				continue;
			}

			const dateKey = dateTime.toISOString().split("T")[0];
			const dateOnly = new Date(dateKey);
			dateOnly.setHours(0, 0, 0, 0);

			if (!dailyMap.has(dateKey)) {
				dailyMap.set(dateKey, {
					date: dateOnly,
					temperature2mMin: null,
					temperature2mMax: null,
					temperature80mMin: null,
					temperature80mMax: null,
					cumulativePrecipitation: 0,
					relative_humidity_2mMin: null,
					relative_humidity_2mMax: null,
					wind_speed_10mMin: null,
					wind_speed_10mMax: null,
					wind_speed_180mMin: null,
					wind_speed_180mMax: null,
				});
			}

			const daily = dailyMap.get(dateKey)!;

			// Process temperature_2m
			const temp2m = hourlyData.temperature_2m[i];
			if (temp2m !== null) {
				if (
					daily.temperature2mMin === null ||
					temp2m < daily.temperature2mMin
				) {
					daily.temperature2mMin = temp2m;
				}
				if (
					daily.temperature2mMax === null ||
					temp2m > daily.temperature2mMax
				) {
					daily.temperature2mMax = temp2m;
				}
			}

			// Process temperature_80m
			const temp80m = hourlyData.temperature_80m[i];
			if (temp80m !== null) {
				if (
					daily.temperature80mMin === null ||
					temp80m < daily.temperature80mMin
				) {
					daily.temperature80mMin = temp80m;
				}
				if (
					daily.temperature80mMax === null ||
					temp80m > daily.temperature80mMax
				) {
					daily.temperature80mMax = temp80m;
				}
			}

			// Process precipitation (sum for cumulative)
			const precipitation = hourlyData.precipitation[i];
			if (precipitation !== null) {
				daily.cumulativePrecipitation =
					(daily.cumulativePrecipitation ?? 0) + precipitation;
			}

			// Process relative_humidity_2m
			const relative_humidity_2m = hourlyData.relative_humidity_2m[i];
			if (relative_humidity_2m !== null) {
				if (
					daily.relative_humidity_2mMin === null ||
					relative_humidity_2m < daily.relative_humidity_2mMin
				) {
					daily.relative_humidity_2mMin = relative_humidity_2m;
				}
				if (
					daily.relative_humidity_2mMax === null ||
					relative_humidity_2m > daily.relative_humidity_2mMax
				) {
					daily.relative_humidity_2mMax = relative_humidity_2m;
				}
			}

			// Process wind_speed_10m
			const wind_speed_10m = hourlyData.wind_speed_10m[i];
			if (wind_speed_10m !== null) {
				if (
					daily.wind_speed_10mMin === null ||
					wind_speed_10m < daily.wind_speed_10mMin
				) {
					daily.wind_speed_10mMin = wind_speed_10m;
				}
				if (
					daily.wind_speed_10mMax === null ||
					wind_speed_10m > daily.wind_speed_10mMax
				) {
					daily.wind_speed_10mMax = wind_speed_10m;
				}
			}

			// Process wind_speed_180m
			const wind_speed_180m = hourlyData.wind_speed_180m[i];
			if (wind_speed_180m !== null) {
				if (
					daily.wind_speed_180mMin === null ||
					wind_speed_180m < (daily?.wind_speed_180mMin ?? 0)
				) {
					daily.wind_speed_180mMin = wind_speed_180m;
				}
				if (
					daily.wind_speed_180mMax === null ||
					wind_speed_180m > (daily?.wind_speed_180mMax ?? 0)
				) {
					daily.wind_speed_180mMax = wind_speed_180m;
				}
			}
		}
		return Array.from(dailyMap.values());
	};

	public static getHistoryWeatherData = async (
		latitude: number,
		longitude: number,
	): Promise<DailyWeatherData[]> => {
		const weatherDataResponse = await OpenMeteoClient.fetchWeatherData(
			latitude,
			longitude,
		);
		const hourlyData = weatherDataResponse.hourly;

		const todayStart = getStartOfUtcDay(new Date());
		const historyStart = subtractUtcDays(todayStart, WEATHER_HISTORY_DAYS);

		const dailyData = OpenMeteoClient.computeDailyWeatherData(
			hourlyData,
			(dateTime) => dateTime < historyStart || dateTime >= todayStart,
		);

		return Array.from(dailyData.values());
	};

	public static getForecastWeatherData = async (
		latitude: number,
		longitude: number,
	): Promise<DailyWeatherData[]> => {
		const forecastResponse = await OpenMeteoClient.fetchWeatherForecast(
			latitude,
			longitude,
		);
		const now = new Date();
		const dailyData = OpenMeteoClient.computeDailyWeatherData(
			forecastResponse.hourly,
			(dateTime) => dateTime <= now,
		);

		return Array.from(dailyData.values());
	};
}
