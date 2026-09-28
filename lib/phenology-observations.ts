import {
	type PhenologicalStage,
	type Prisma,
	type PrismaClient,
} from "@prisma/client";
import { Errors } from "@/lib/constants";
import { getStageExpiryCutoff } from "./phenology";

type DbClient = PrismaClient | Prisma.TransactionClient;

// One observation per treatment row: createTreatment creates one Treatment per parcel.
export async function createObservationsForTreatments(
	db: DbClient,
	{
		userId,
		stage,
		observedAt,
		treatments,
	}: {
		userId: string;
		stage: PhenologicalStage;
		observedAt: Date;
		treatments: { id: string; parcelId: string }[];
	},
) {
	return db.phenologyObservation.createMany({
		data: treatments.map((treatment) => ({
			userId,
			parcelId: treatment.parcelId,
			treatmentId: treatment.id,
			stage,
			observedAt,
		})),
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
		data: { userId, parcelId, stage, observedAt },
		select: { id: true, parcelId: true, stage: true, observedAt: true },
	});
}

// Latest non-expired observation per parcel at `date`. Parcels without one have no
// current stage and are left out.
export async function getCurrentStagesByParcel(
	db: DbClient,
	userId: string,
	date: Date,
) {
	return db.phenologyObservation.findMany({
		where: {
			userId,
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
