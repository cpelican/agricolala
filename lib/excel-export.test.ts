import { beforeEach, describe, expect, test, vi } from "vitest";
import * as XLSX from "xlsx";
import { type PrismaClient } from "@prisma/client";
import { cleanDatabase, seedTestData } from "@/test/setup-utilities";
import { getTestPrisma } from "@/test/test-prisma-client";
import { generateTreatmentsExcel } from "./excel-export";

vi.mock("server-only", () => ({}));

function readTreatmentIds(buffer: Buffer) {
	const workbook = XLSX.read(buffer, { type: "buffer" });
	const rows = XLSX.utils.sheet_to_json<{ treatmentId: string }>(
		workbook.Sheets["Product Applications"],
	);
	return [...new Set(rows.map((row) => row.treatmentId))];
}

describe("[Integration] Excel export", () => {
	let testPrisma: PrismaClient;
	let testData: Awaited<ReturnType<typeof seedTestData>>;

	beforeEach(async () => {
		testPrisma = getTestPrisma();
		await cleanDatabase();
		testData = await seedTestData();
	});

	test("contains every treatment on the user's member parcels (D6)", async () => {
		const { testParcel, pastTreatment } = testData;
		const year = pastTreatment.appliedDate?.getFullYear() ?? 0;
		const userB = await testPrisma.user.create({
			data: { email: "b@example.com", isAuthorized: true },
		});
		const userC = await testPrisma.user.create({
			data: { email: "c@example.com", isAuthorized: true },
		});
		await testPrisma.parcelMember.create({
			data: { parcelId: testParcel.id, userId: userB.id },
		});

		// A recorded the treatment; B, a member, exports it; C does not.
		expect(
			readTreatmentIds(await generateTreatmentsExcel(userB.id, year)),
		).toEqual([pastTreatment.id]);
		expect(
			readTreatmentIds(await generateTreatmentsExcel(userC.id, year)),
		).toEqual([]);
	});
});
