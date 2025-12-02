import { Errors } from "@/lib/constants";
import { OpenMeteoClient } from "./openMeteoClient";
import { prisma } from "./prisma";

const average = (arr: number[]) => {
	return arr.reduce((acc, curr) => acc + curr, 0) / arr.length;
};

const getNext3DaysRain = async (parcelId: string) => {
	const parcel = await prisma.parcel.findUnique({
		where: {
			id: parcelId,
		},
		select: {
			latitude: true,
			longitude: true,
		},
	});
	if (!parcel?.latitude || !parcel?.longitude) {
		throw new Error(Errors.RESOURCE_NOT_FOUND);
	}
	return await OpenMeteoClient.getForecastWeatherData(
		parcel.latitude,
		parcel.longitude,
	);
};

const MAX_WIND_SPEED_FOR_TREATMENT = 15;
// https://terraevita.edagricole.it/featured/come-funziona-resistenza-dilavamento/
const MAX_CUMULATIVE_PRECIPITATION_FOR_TREATMENT = 25;

export interface DayApplicability {
	date: Date;
	cumulativePrecipitation: number;
	averageWindSpeed: number;
	applicable: boolean;
}

const MIN_MONTH_FOR_TREATMENT = 3;
const MAX_MONTH_FOR_TREATMENT = 10;

export const getNext3DaysTreatmentApplicability = async (
	parcelId: string,
): Promise<DayApplicability[]> => {
	const currentMonth = new Date().getMonth() + 1;

	if (
		currentMonth < MIN_MONTH_FOR_TREATMENT ||
		currentMonth > MAX_MONTH_FOR_TREATMENT
	) {
		return [];
	}

	const next3Days = await getNext3DaysRain(parcelId);

	return next3Days.map((day) => {
		const avgWind10m = average([
			day.wind_speed_10mMax ?? 0,
			day.wind_speed_10mMin ?? 0,
		]);
		const avgWind180m = average([
			day.wind_speed_180mMax ?? 0,
			day.wind_speed_180mMin ?? 0,
		]);
		const cumulativePrecipitation = day.cumulativePrecipitation ?? 0;
		const avgWind = average([avgWind10m, avgWind180m]);
		const applicable =
			avgWind10m < MAX_WIND_SPEED_FOR_TREATMENT ||
			avgWind180m < MAX_WIND_SPEED_FOR_TREATMENT ||
			cumulativePrecipitation >= MAX_CUMULATIVE_PRECIPITATION_FOR_TREATMENT;

		return {
			date: day.date,
			cumulativePrecipitation: day.cumulativePrecipitation ?? 0,
			averageWindSpeed: avgWind,
			applicable,
		};
	});
};
