import { describe, test, expect, beforeEach } from "vitest";
import { PhenologicalStage, type PrismaClient } from "@prisma/client";
import { cleanDatabase, seedTestData } from "@/test/setup-utilities";
import { getTestPrisma } from "@/test/test-prisma-client";
import { Errors } from "@/lib/constants";
import {
	createObservationsForParcels,
	createStandaloneObservation,
	getCurrentStagesByParcel,
	getObservationsForPeriod,
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

	async function createParcel(userId: string) {
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

	async function createOtherUser() {
		return testPrisma.user.create({
			data: { email: "other@example.com", isAuthorized: true },
		});
	}

	test("creates one observation per treated parcel", async () => {
		const { testUser, testParcel } = testData;
		const secondParcel = await createParcel(testUser.id);
		const observedAt = daysAgo(1);

		await createObservationsForParcels(testPrisma, {
			parcelIds: [testParcel.id, secondParcel.id],
			stage: PhenologicalStage.FLOWERING,
			observedAt,
		});

		const observations = await testPrisma.phenologyObservation.findMany({
			select: { parcelId: true, stage: true, observedAt: true },
			orderBy: { parcelId: "asc" },
		});
		expect(observations).toEqual(
			[testParcel.id, secondParcel.id].sort().map((parcelId) => ({
				parcelId,
				stage: PhenologicalStage.FLOWERING,
				observedAt,
			})),
		);
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
		expect(observation.stage).toBe(PhenologicalStage.BUD_BREAK);
	});

	test("refuses a standalone observation on another user's parcel", async () => {
		const { testParcel } = testData;
		const otherUser = await createOtherUser();

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
		const secondParcel = await createParcel(testUser.id);
		const thirdParcel = await createParcel(testUser.id);

		await testPrisma.phenologyObservation.createMany({
			data: [
				// First parcel: older then newer observation → newer wins
				{
					parcelId: testParcel.id,
					stage: PhenologicalStage.FLOWER_CLUSTERS,
					observedAt: daysAgo(10),
				},
				{
					parcelId: testParcel.id,
					stage: PhenologicalStage.FLOWERING,
					observedAt: daysAgo(2),
				},
				// Observation after the reference date is ignored
				{
					parcelId: testParcel.id,
					stage: PhenologicalStage.FRUIT_SET,
					observedAt: new Date(NOW.getTime() + MS_PER_DAY),
				},
				// Second parcel: only an expired observation → no current stage
				{
					parcelId: secondParcel.id,
					stage: PhenologicalStage.BUD_BREAK,
					observedAt: daysAgo(STAGE_EXPIRES_AFTER_DAYS + 1),
				},
				// Third parcel: exactly at the expiry limit still counts
				{
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

	test("ignores observations on other users' parcels", async () => {
		const { testUser } = testData;
		const otherUser = await createOtherUser();
		const otherParcel = await createParcel(otherUser.id);
		await testPrisma.phenologyObservation.create({
			data: {
				parcelId: otherParcel.id,
				stage: PhenologicalStage.FLOWERING,
				observedAt: daysAgo(1),
			},
		});

		expect(
			await getCurrentStagesByParcel(testPrisma, testUser.id, NOW),
		).toEqual([]);
	});

	test("lists the user's observations for a period, oldest first", async () => {
		const { testUser, testParcel } = testData;
		const otherUser = await createOtherUser();
		const otherParcel = await createParcel(otherUser.id);
		const from = daysAgo(30);

		await testPrisma.phenologyObservation.createMany({
			data: [
				{
					parcelId: testParcel.id,
					stage: PhenologicalStage.FLOWERING,
					observedAt: daysAgo(2),
				},
				// Within the expiry window before `from`: still gives a stage at `from`
				{
					parcelId: testParcel.id,
					stage: PhenologicalStage.BUD_BREAK,
					observedAt: daysAgo(30 + STAGE_EXPIRES_AFTER_DAYS),
				},
				// Too old to matter for the period
				{
					parcelId: testParcel.id,
					stage: PhenologicalStage.BUD_BREAK,
					observedAt: daysAgo(30 + STAGE_EXPIRES_AFTER_DAYS + 1),
				},
				// After the period
				{
					parcelId: testParcel.id,
					stage: PhenologicalStage.FRUIT_SET,
					observedAt: new Date(NOW.getTime() + MS_PER_DAY),
				},
				// Another user's parcel
				{
					parcelId: otherParcel.id,
					stage: PhenologicalStage.FLOWERING,
					observedAt: daysAgo(1),
				},
			],
		});

		const observations = await getObservationsForPeriod(
			testPrisma,
			testUser.id,
			from,
			NOW,
		);

		expect(observations.map((o) => o.stage)).toEqual([
			PhenologicalStage.BUD_BREAK,
			PhenologicalStage.FLOWERING,
		]);
	});
});
