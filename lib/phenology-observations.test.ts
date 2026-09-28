import { describe, test, expect, beforeEach } from "vitest";
import { PhenologicalStage, type PrismaClient } from "@prisma/client";
import { cleanDatabase, seedTestData } from "@/test/setup-utilities";
import { getTestPrisma } from "@/test/test-prisma-client";
import { Errors } from "@/lib/constants";
import {
	createObservationsForTreatments,
	createStandaloneObservation,
	getCurrentStagesByParcel,
} from "./phenology-observations";
import { STAGE_EXPIRES_AFTER_DAYS } from "./phenology";

const MS_PER_DAY = 1000 * 60 * 60 * 24;
const NOW = new Date(2026, 5, 1, 12);

function daysAgo(days: number) {
	return new Date(NOW.getTime() - days * MS_PER_DAY);
}

describe("[Integration] phenology observations", () => {
	let testPrisma: PrismaClient;
	let testData: Awaited<ReturnType<typeof seedTestData>>;

	beforeEach(async () => {
		testPrisma = getTestPrisma();
		await cleanDatabase();
		testData = await seedTestData();
	});

	async function createSecondParcel(userId: string) {
		return testPrisma.parcel.create({
			data: {
				name: "Second Vineyard",
				latitude: 44.1,
				longitude: 9.74,
				width: 50,
				height: 50,
				type: "VINEYARD",
				userId,
			},
		});
	}

	test("creates one observation per treatment, linked to its parcel and treatment", async () => {
		const { testUser, testParcel } = testData;
		const secondParcel = await createSecondParcel(testUser.id);
		const treatments = await testPrisma.treatment.createManyAndReturn({
			data: [testParcel, secondParcel].map((parcel) => ({
				parcelId: parcel.id,
				userId: testUser.id,
				status: "DONE" as const,
				appliedDate: daysAgo(1),
			})),
			select: { id: true, parcelId: true },
		});

		await createObservationsForTreatments(testPrisma, {
			userId: testUser.id,
			stage: PhenologicalStage.FLOWERING,
			observedAt: daysAgo(1),
			treatments,
		});

		const observations = await testPrisma.phenologyObservation.findMany({
			where: { userId: testUser.id },
			select: { parcelId: true, treatmentId: true, stage: true },
			orderBy: { parcelId: "asc" },
		});
		expect(observations).toEqual(
			treatments
				.map((t) => ({
					parcelId: t.parcelId,
					treatmentId: t.id,
					stage: PhenologicalStage.FLOWERING,
				}))
				.sort((a, b) => a.parcelId.localeCompare(b.parcelId)),
		);
	});

	test("keeps the observation when its treatment is deleted", async () => {
		const { testUser, testParcel, pastTreatment } = testData;
		await createObservationsForTreatments(testPrisma, {
			userId: testUser.id,
			stage: PhenologicalStage.FRUIT_SET,
			observedAt: daysAgo(1),
			treatments: [{ id: pastTreatment.id, parcelId: testParcel.id }],
		});

		await testPrisma.treatment.delete({ where: { id: pastTreatment.id } });

		const observation = await testPrisma.phenologyObservation.findFirstOrThrow({
			where: { parcelId: testParcel.id },
		});
		expect(observation.treatmentId).toBeNull();
		expect(observation.stage).toBe(PhenologicalStage.FRUIT_SET);
	});

	test("records a standalone observation on the user's own parcel", async () => {
		const { testUser, testParcel } = testData;
		const observation = await createStandaloneObservation(testPrisma, {
			userId: testUser.id,
			parcelId: testParcel.id,
			stage: PhenologicalStage.BUD_BREAK,
			observedAt: daysAgo(0),
		});

		expect(observation.parcelId).toBe(testParcel.id);
		const stored = await testPrisma.phenologyObservation.findUniqueOrThrow({
			where: { id: observation.id },
		});
		expect(stored.treatmentId).toBeNull();
	});

	test("refuses a standalone observation on another user's parcel", async () => {
		const { testParcel } = testData;
		const otherUser = await testPrisma.user.create({
			data: { email: "other@example.com", isAuthorized: true },
		});

		await expect(
			createStandaloneObservation(testPrisma, {
				userId: otherUser.id,
				parcelId: testParcel.id,
				stage: PhenologicalStage.BUD_BREAK,
				observedAt: daysAgo(0),
			}),
		).rejects.toThrow(Errors.RESOURCE_NOT_FOUND);
		expect(await testPrisma.phenologyObservation.count()).toBe(0);
	});

	test("returns the latest non-expired stage per parcel", async () => {
		const { testUser, testParcel } = testData;
		const secondParcel = await createSecondParcel(testUser.id);
		const thirdParcel = await createSecondParcel(testUser.id);

		await testPrisma.phenologyObservation.createMany({
			data: [
				// First parcel: older then newer observation → newer wins
				{
					userId: testUser.id,
					parcelId: testParcel.id,
					stage: PhenologicalStage.FLOWER_CLUSTERS,
					observedAt: daysAgo(10),
				},
				{
					userId: testUser.id,
					parcelId: testParcel.id,
					stage: PhenologicalStage.FLOWERING,
					observedAt: daysAgo(2),
				},
				// Observation after the reference date is ignored
				{
					userId: testUser.id,
					parcelId: testParcel.id,
					stage: PhenologicalStage.FRUIT_SET,
					observedAt: new Date(NOW.getTime() + MS_PER_DAY),
				},
				// Second parcel: only an expired observation → no current stage
				{
					userId: testUser.id,
					parcelId: secondParcel.id,
					stage: PhenologicalStage.BUD_BREAK,
					observedAt: daysAgo(STAGE_EXPIRES_AFTER_DAYS + 1),
				},
				// Third parcel: exactly at the expiry limit still counts
				{
					userId: testUser.id,
					parcelId: thirdParcel.id,
					stage: PhenologicalStage.LEAVES_UNFOLDING,
					observedAt: daysAgo(STAGE_EXPIRES_AFTER_DAYS),
				},
			],
		});

		const stages = await getCurrentStagesByParcel(testPrisma, testUser.id, NOW);
		const stageByParcel = Object.fromEntries(
			stages.map((s) => [s.parcelId, s.stage]),
		);

		expect(stageByParcel).toEqual({
			[testParcel.id]: PhenologicalStage.FLOWERING,
			[thirdParcel.id]: PhenologicalStage.LEAVES_UNFOLDING,
		});
	});

	test("ignores other users' observations", async () => {
		const { testUser } = testData;
		const otherUser = await testPrisma.user.create({
			data: { email: "other@example.com", isAuthorized: true },
		});
		const otherParcel = await createSecondParcel(otherUser.id);
		await testPrisma.phenologyObservation.create({
			data: {
				userId: otherUser.id,
				parcelId: otherParcel.id,
				stage: PhenologicalStage.FLOWERING,
				observedAt: daysAgo(1),
			},
		});

		expect(
			await getCurrentStagesByParcel(testPrisma, testUser.id, NOW),
		).toEqual([]);
	});
});
