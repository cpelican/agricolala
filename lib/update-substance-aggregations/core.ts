import { type Prisma, type PrismaClient } from "@prisma/client";
import { calculateSubstanceData } from "../substance-helpers";
import { getCachedCompositions } from "../data-fetcher";
import {
	updateUserAggregations,
	updateParcelAggregations,
} from "../aggregation-utils";
import { parcelAccessWhere, treatmentAccessWhere } from "../parcel-access";

type TreatmentForAggregation = Awaited<
	ReturnType<typeof fetchTreatmentsForAggregation>
>[number];

function transformTreatmentForAggregation(treatment: TreatmentForAggregation) {
	return {
		id: treatment.id,
		appliedDate: treatment.appliedDate,
		parcelId: treatment.parcelId,
		parcelName: treatment.parcel.name,
		parcel: {
			width: treatment.parcel.width,
			height: treatment.parcel.height,
			areaM2: treatment.parcel.areaM2,
		},
		productApplications: treatment.productApplications.map((app) => ({
			dose: app.dose,
			product: {
				id: app.product.id,
				composition: app.product.composition.map((comp) => ({
					dose: comp.dose,
					substanceId: comp.substanceId,
				})),
			},
		})),
	};
}

const treatmentForAggregationSelect = {
	id: true,
	appliedDate: true,
	parcelId: true,
	productApplications: {
		select: {
			dose: true,
			product: {
				select: {
					id: true,
					composition: {
						select: {
							dose: true,
							substanceId: true,
						},
					},
				},
			},
		},
	},
	parcel: {
		select: {
			width: true,
			height: true,
			areaM2: true,
			name: true,
		},
	},
} satisfies Prisma.TreatmentSelect;

// DONE treatments of the year matching `where`, whoever recorded them.
async function fetchTreatmentsForAggregation(
	prisma: PrismaClient,
	where: Prisma.TreatmentWhereInput,
	year: number,
) {
	return prisma.treatment.findMany({
		where: {
			...where,
			appliedDate: {
				gte: new Date(year, 0, 1),
				lte: new Date(year, 11, 31),
			},
			status: "DONE",
		},
		select: treatmentForAggregationSelect,
	});
}

// A parcel's totals count every treatment on it, by any member.
async function rebuildParcelAggregations(
	prisma: PrismaClient,
	parcelIds: string[],
	year: number,
) {
	if (parcelIds.length === 0) return;

	const treatments = (
		await fetchTreatmentsForAggregation(
			prisma,
			{ parcelId: { in: parcelIds } },
			year,
		)
	).map(transformTreatmentForAggregation);
	const compositions = await getCachedCompositions();

	await prisma.parcelSubstanceAggregation.deleteMany({
		where: { parcelId: { in: parcelIds }, year },
	});

	await Promise.all(
		parcelIds.map(async (parcelId) => {
			const parcelSubstanceData = calculateSubstanceData(
				treatments.filter((treatment) => treatment.parcelId === parcelId),
				compositions,
			);

			if (parcelSubstanceData.length > 0) {
				await updateParcelAggregations(
					prisma,
					parcelSubstanceData,
					parcelId,
					year,
				);
			}
		}),
	);
}

// A user's dashboard totals count every treatment on the parcels they are a member of.
async function rebuildUserAggregations(
	prisma: PrismaClient,
	userId: string,
	year: number,
) {
	const treatments = (
		await fetchTreatmentsForAggregation(
			prisma,
			treatmentAccessWhere(userId),
			year,
		)
	).map(transformTreatmentForAggregation);
	const userSubstanceData = calculateSubstanceData(
		treatments,
		await getCachedCompositions(),
	);

	await prisma.userSubstanceAggregation.deleteMany({
		where: { userId, year },
	});

	await updateUserAggregations(prisma, userSubstanceData, userId, year);
}

/**
 * Refreshes the totals of `parcelIds`, then the dashboard totals of every member of
 * those parcels and of `userIds` (e.g. the members of a parcel that was just deleted).
 */
export async function updateSubstanceAggregations(
	prisma: PrismaClient,
	{ parcelIds, userIds = [] }: { parcelIds: string[]; userIds?: string[] },
	year: number = new Date().getFullYear(),
) {
	await rebuildParcelAggregations(prisma, parcelIds, year);

	const members = await prisma.parcelMember.findMany({
		where: { parcelId: { in: parcelIds } },
		select: { userId: true },
	});
	const memberIds = new Set([
		...members.map((member) => member.userId),
		...userIds,
	]);

	for (const userId of memberIds) {
		await rebuildUserAggregations(prisma, userId, year);
	}
}

/**
 * One user's member parcels and their members, or every parcel and every user, so a
 * user unlinked from all their parcels is cleared too.
 */
export async function rebuildSubstanceAggregations(
	prisma: PrismaClient,
	year: number,
	{ userId }: { userId?: string } = {},
) {
	const parcels = await prisma.parcel.findMany({
		where: userId ? parcelAccessWhere(userId) : {},
		select: { id: true },
	});
	const userIds = userId
		? [userId]
		: (await prisma.user.findMany({ select: { id: true } })).map(
				(user) => user.id,
			);

	await updateSubstanceAggregations(
		prisma,
		{ parcelIds: parcels.map((parcel) => parcel.id), userIds },
		year,
	);
}
