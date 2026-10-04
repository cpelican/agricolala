import {
	type PhenologicalStage,
	type Prisma,
	type PrismaClient,
} from "@prisma/client";
import { Errors } from "@/lib/constants";
import { getStageExpiryCutoff } from "./phenology";

type DbClient = PrismaClient | Prisma.TransactionClient;

// Stage observed on each treated parcel when a treatment is recorded.
export async function createObservationsForParcels(
	db: DbClient,
	{
		parcelIds,
		stage,
		observedAt,
	}: {
		parcelIds: string[];
		stage: PhenologicalStage;
		observedAt: Date;
	},
) {
	return db.phenologyObservation.createMany({
		data: parcelIds.map((parcelId) => ({ parcelId, stage, observedAt })),
	});
}

// Observation made without a treatment (the parcel card's "Update stage").
export async function createStandaloneObservation(
	db: DbClient,
	{
		userId,
		parcelId,
		stage,
		observedAt,
	}: {
		userId: string;
		parcelId: string;
		stage: PhenologicalStage;
		observedAt: Date;
	},
) {
	const parcel = await db.parcel.findFirst({
		where: { id: parcelId, userId },
		select: { id: true },
	});
	if (!parcel) {
		throw new Error(Errors.RESOURCE_NOT_FOUND);
	}

	return db.phenologyObservation.create({
		data: { parcelId, stage, observedAt },
		select: { id: true, parcelId: true, stage: true, observedAt: true },
	});
}

// Latest non-expired observation per parcel of the user at `date`. Parcels without
// one have no current stage and are left out.
export async function getCurrentStagesByParcel(
	db: DbClient,
	userId: string,
	date: Date,
) {
	return db.phenologyObservation.findMany({
		where: {
			parcel: { userId },
			observedAt: { lte: date, gte: getStageExpiryCutoff(date) },
		},
		orderBy: [{ observedAt: "desc" }, { createdAt: "desc" }],
		distinct: ["parcelId"],
		select: { parcelId: true, stage: true, observedAt: true },
	});
}

export type CurrentParcelStage = Awaited<
	ReturnType<typeof getCurrentStagesByParcel>
>[number];

// Every observation of the user's parcels that can give a stage to a date in
// [from, to], i.e. including the expiry window before `from`. Oldest first.
export async function getObservationsForPeriod(
	db: DbClient,
	userId: string,
	from: Date,
	to: Date,
) {
	return db.phenologyObservation.findMany({
		where: {
			parcel: { userId },
			observedAt: { gte: getStageExpiryCutoff(from), lte: to },
		},
		orderBy: [{ observedAt: "asc" }, { createdAt: "asc" }],
		select: { parcelId: true, stage: true, observedAt: true },
	});
}
