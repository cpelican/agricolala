import { TreatmentStatus } from "@prisma/client";
import { cache } from "react";
import { prisma } from "./prisma";
import {
	getCurrentStagesByParcel,
	getLatestObservation,
	getObservationsForPeriod,
} from "./phenology-observations";
import { getStageExpiryCutoff } from "./phenology";
import { lastTreatmentSelect } from "./treatment-suggestions";
import { parcelAccessWhere, treatmentAccessWhere } from "./parcel-access";

export * from "./data-fetcher-aggregations";
export * from "./data-fetcher-catalog";
export * from "./data-fetcher-coverage";

const productApplicationsSelect = {
	dose: true,
	product: {
		select: {
			id: true,
			name: true,
			brand: true,
			doseUnit: true,
			productLiterToKiloGramConversionRate: true,
			composition: {
				select: {
					dose: true,
					substanceId: true,
				},
			},
		},
	},
};

// Who recorded a treatment, shown on cards when it is another member (D1).
const treatmentAuthorSelect = {
	select: { id: true, name: true, email: true },
};

const parcelSelect = {
	id: true,
	name: true,
	latitude: true,
	longitude: true,
	width: true,
	height: true,
	areaM2: true,
	boundary: true,
	type: true,
	createdAt: true,
	updatedAt: true,
	treatments: {
		select: {
			id: true,
			appliedDate: true,
			status: true,
			productApplications: {
				select: productApplicationsSelect,
			},
		},
		where: {
			status: TreatmentStatus.DONE,
			appliedDate: {
				gte: new Date(new Date().getFullYear(), 0, 1),
				lte: new Date(new Date().getFullYear(), 11, 31),
			},
		},
		take: 5, // Limit treatments per parcel for performance
	},
};

const parcelDetailSelect = {
	id: true,
	name: true,
	userId: true,
	latitude: true,
	longitude: true,
	width: true,
	height: true,
	areaM2: true,
	boundary: true,
	type: true,
	createdAt: true,
	updatedAt: true,
	treatments: {
		select: {
			id: true,
			appliedDate: true,
			dateMin: true,
			dateMax: true,
			status: true,
			waterDose: true,
			diseaseIds: true,
			user: treatmentAuthorSelect,
			productApplications: {
				select: productApplicationsSelect,
			},
		},
		where: {
			appliedDate: {
				gte: new Date(new Date().getFullYear(), 0, 1), // January 1st of current year
			},
		},
		orderBy: [{ status: "asc" as const }, { appliedDate: "desc" as const }],
	},
};

const treatmentSelect = {
	id: true,
	appliedDate: true,
	dateMin: true,
	dateMax: true,
	status: true,
	waterDose: true,
	diseaseIds: true,
	user: treatmentAuthorSelect,
	parcel: {
		select: {
			id: true,
			name: true,
		},
	},
	productApplications: {
		select: productApplicationsSelect,
	},
};

export const getParcels = cache(async (userId: string) => {
	return await prisma.parcel.findMany({
		where: parcelAccessWhere(userId),
		select: parcelSelect,
		orderBy: { createdAt: "desc" },
	});
});

export const getParcelDetail = cache(
	async (parcelId: string, userId: string) => {
		const parcel = await prisma.parcel.findFirst({
			where: { id: parcelId, ...parcelAccessWhere(userId) },
			select: parcelDetailSelect,
		});

		return parcel;
	},
);

export const getTreatments = cache(async (userId: string) => {
	return await prisma.treatment.findMany({
		where: {
			...treatmentAccessWhere(userId),
			OR: [
				// Treatments with appliedDate in current year (January onwards)
				{
					appliedDate: {
						gte: new Date(new Date().getFullYear(), 0, 1), // January 1st of current year
					},
				},
				// Treatments with dateMin in current year (for scheduled treatments)
				{
					dateMin: {
						gte: new Date(new Date().getFullYear(), 0, 1), // January 1st of current year
					},
				},
			],
		},
		select: treatmentSelect,
		orderBy: [{ appliedDate: "desc" as const }, { dateMin: "desc" as const }],
	});
});

// Current (non-expired) phenological stage per parcel, as of now.
export const getStageByParcel = cache(async (userId: string) => {
	return await getCurrentStagesByParcel(prisma, userId, new Date());
});

// Every treatment applied during the year, for the Excel export.
export const getTreatmentsForYear = cache(
	async (userId: string, yearStart: Date, yearEnd: Date) => {
		return await prisma.treatment.findMany({
			where: {
				userId,
				appliedDate: {
					gte: yearStart,
					lte: yearEnd,
				},
			},
			select: treatmentSelect,
			orderBy: {
				appliedDate: "desc",
			},
		});
	},
);

export const getObservationsForYear = cache(
	async (userId: string, yearStart: Date, yearEnd: Date) => {
		return await getObservationsForPeriod(prisma, userId, yearStart, yearEnd);
	},
);

// Not filtered by user: callers load the parcel through getParcelDetail first.
export const getParcelLocation = cache(async (parcelId: string) => {
	return await prisma.parcel.findUnique({
		where: { id: parcelId },
		select: { latitude: true, longitude: true },
	});
});

export const getLatestParcelObservation = cache(
	async (parcelId: string, now: Date) => {
		return await getLatestObservation(prisma, parcelId, now);
	},
);

// For the suggest-treatments cron: every approved user's parcels with their last
// done treatment of the year and their current stage at the reference date.
export async function getAuthorizedUsersWithLastTreatments(
	referenceDate: Date,
) {
	const year = referenceDate.getFullYear();
	return await prisma.user.findMany({
		where: {
			isAuthorized: true,
		},
		select: {
			id: true,
			parcels: {
				select: {
					id: true,
					treatments: {
						where: {
							status: TreatmentStatus.DONE,
							appliedDate: {
								not: null,
								gte: new Date(year, 0, 1),
								lt: new Date(year + 1, 0, 1),
							},
						},
						orderBy: {
							appliedDate: "desc",
						},
						take: 1, // Get only the most recent treatment per parcel
						select: lastTreatmentSelect,
					},
					// Current stage: latest observation on or before the date, unless expired.
					phenologyObservations: {
						where: {
							observedAt: {
								lte: referenceDate,
								gte: getStageExpiryCutoff(referenceDate),
							},
						},
						orderBy: [{ observedAt: "desc" }, { createdAt: "desc" }],
						take: 1,
						select: { stage: true },
					},
				},
			},
		},
	});
}

// For the weather history cron.
export async function getEnabledWeatherHistoryTasks() {
	return await prisma.weatherHistoryTask.findMany({
		where: {
			enabled: true,
		},
	});
}

export async function getWeatherHistoryTaskParcelIds(taskId: string) {
	const parcels = await prisma.parcel.findMany({
		where: {
			weatherHistoryTasks: {
				some: {
					id: taskId,
				},
			},
		},
		select: {
			id: true,
		},
	});
	return parcels.map((parcel) => parcel.id);
}

// Done treatments of the current year on the user's member parcels, with the parcel's area and each product's
// substances: what the copper budget pacing needs for the dose per treatment (P7).
export const getDoneTreatmentDoses = cache(async (userId: string) => {
	return await prisma.treatment.findMany({
		where: {
			...treatmentAccessWhere(userId),
			status: TreatmentStatus.DONE,
			appliedDate: { gte: new Date(new Date().getFullYear(), 0, 1) },
		},
		select: {
			parcelId: true,
			parcel: { select: { width: true, height: true, areaM2: true } },
			productApplications: {
				select: {
					dose: true,
					product: {
						select: {
							composition: {
								select: { dose: true, substance: { select: { name: true } } },
							},
						},
					},
				},
			},
		},
	});
});

export type TreatmentType = Awaited<ReturnType<typeof getTreatments>>[number];
export type ParcelWithTreatments = Awaited<
	ReturnType<typeof getParcels>
>[number];
export type ParcelDetailType = NonNullable<
	Awaited<ReturnType<typeof getParcelDetail>>
>;
