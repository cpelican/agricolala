import { beforeEach, describe, expect, test, vi } from "vitest";
import { getServerSession } from "next-auth/next";
import {
	PhenologicalStage,
	ProductDoseUnit,
	type PrismaClient,
	type User,
} from "@prisma/client";
import { cleanDatabase, seedTestData } from "@/test/setup-utilities";
import { getTestPrisma } from "@/test/test-prisma-client";
import { Errors } from "./constants";
import { createTreatment, deleteParcel, deleteTreatment } from "./actions";
import { recordPhenologyObservation } from "./actions-phenology";
import {
	getParcelDetail,
	getParcels,
	getStageByParcel,
	getTreatments,
	getTreatmentsWithParcelWeather,
} from "./data-fetcher";

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next-auth/next", () => ({ getServerSession: vi.fn() }));

const signInAs = (user: User) => {
	vi.mocked(getServerSession).mockResolvedValue({
		expires: new Date(Date.now() + 60_000).toISOString(),
		user: { ...user, locale: "en" },
	});
};

// A (testUser) created the parcel and B is linked to it; C has no access.
describe("[Integration] shared parcels", () => {
	let testPrisma: PrismaClient;
	let testData: Awaited<ReturnType<typeof seedTestData>>;
	let userA: User;
	let userB: User;
	let userC: User;

	const treatmentFormData = (parcelId: string) => {
		const formData = new FormData();
		formData.set("appliedDate", new Date().toISOString());
		formData.append("parcelIds", parcelId);
		formData.set(
			"diseases",
			JSON.stringify([{ diseaseId: testData.peronospora.id }]),
		);
		formData.set(
			"productApplications",
			JSON.stringify([
				{
					productId: testData.copperProduct.id,
					dose: 100,
					doseUnit: ProductDoseUnit.GRAM,
				},
			]),
		);
		formData.set("waterDose", "10");
		return formData;
	};

	const createTreatmentAs = async (user: User) => {
		signInAs(user);
		const { treatments } = await createTreatment(
			treatmentFormData(testData.testParcel.id),
		);
		return treatments[0];
	};

	beforeEach(async () => {
		testPrisma = getTestPrisma();
		await cleanDatabase();
		testData = await seedTestData();
		userA = testData.testUser;
		userB = await testPrisma.user.create({
			data: { email: "b@example.com", name: "Bea", isAuthorized: true },
		});
		userC = await testPrisma.user.create({
			data: { email: "c@example.com", isAuthorized: true },
		});
		await testPrisma.parcelMember.create({
			data: { parcelId: testData.testParcel.id, userId: userB.id },
		});
	});

	test("a member lists and opens the shared parcel; others do not", async () => {
		const { testParcel } = testData;

		expect((await getParcels(userB.id)).map((p) => p.id)).toEqual([
			testParcel.id,
		]);
		expect((await getParcelDetail(testParcel.id, userB.id))?.userId).toBe(
			userA.id,
		);
		expect(
			(await getTreatmentsWithParcelWeather(userB.id)).map((p) => p.id),
		).toEqual([testParcel.id]);

		expect(await getParcels(userC.id)).toEqual([]);
		expect(await getParcelDetail(testParcel.id, userC.id)).toBeNull();
		expect(await getTreatmentsWithParcelWeather(userC.id)).toEqual([]);
	});

	test("members see each other's treatments with their author", async () => {
		const treatmentOfB = await createTreatmentAs(userB);
		const { pastTreatment } = testData;

		const seenByA = await getTreatments(userA.id);
		expect(seenByA.map((t) => t.id).sort()).toEqual(
			[pastTreatment.id, treatmentOfB].sort(),
		);
		expect(seenByA.find((t) => t.id === treatmentOfB)?.user).toEqual({
			id: userB.id,
			name: "Bea",
			email: "b@example.com",
		});

		const seenByB = await getTreatments(userB.id);
		expect(seenByB.map((t) => t.id)).toContain(pastTreatment.id);

		expect(await getTreatments(userC.id)).toEqual([]);
	});

	test("a non-member cannot treat the parcel", async () => {
		signInAs(userC);
		await expect(
			createTreatment(treatmentFormData(testData.testParcel.id)),
		).rejects.toThrow(Errors.RESOURCE_NOT_FOUND);
	});

	test("only its author deletes a treatment", async () => {
		const treatmentOfB = await createTreatmentAs(userB);

		signInAs(userB);
		await expect(deleteTreatment(testData.pastTreatment.id)).rejects.toThrow(
			Errors.RESOURCE_NOT_FOUND,
		);
		await expect(deleteTreatment(treatmentOfB)).resolves.toMatchObject({
			success: true,
		});
		expect(
			await testPrisma.treatment.findUnique({
				where: { id: testData.pastTreatment.id },
			}),
		).not.toBeNull();
	});

	test("only the creator deletes the parcel", async () => {
		const { testParcel } = testData;

		signInAs(userC);
		await expect(deleteParcel(testParcel.id)).rejects.toThrow(
			Errors.RESOURCE_NOT_FOUND,
		);
		signInAs(userB);
		await expect(deleteParcel(testParcel.id)).rejects.toThrow(
			Errors.ACCESS_DENIED,
		);
		signInAs(userA);
		await expect(deleteParcel(testParcel.id)).resolves.toMatchObject({
			success: true,
		});
		expect(
			await testPrisma.parcel.findUnique({ where: { id: testParcel.id } }),
		).toBeNull();
	});

	test("a stage recorded by a member is seen by the others", async () => {
		const { testParcel } = testData;
		const formData = new FormData();
		formData.set("parcelId", testParcel.id);
		formData.set("stage", PhenologicalStage.FLOWERING);
		formData.set("observedAt", new Date().toISOString());

		signInAs(userB);
		await recordPhenologyObservation(formData);

		const stagesOfA = await getStageByParcel(userA.id);
		expect(stagesOfA).toEqual([
			expect.objectContaining({
				parcelId: testParcel.id,
				stage: PhenologicalStage.FLOWERING,
			}),
		]);
		expect(await getStageByParcel(userC.id)).toEqual([]);

		signInAs(userC);
		await expect(recordPhenologyObservation(formData)).rejects.toThrow();
	});
});
