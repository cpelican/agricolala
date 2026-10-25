import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { getServerSession } from "next-auth";
import { type PrismaClient } from "@prisma/client";
import { cleanDatabase, seedTestData } from "@/test/setup-utilities";
import { getTestPrisma } from "@/test/test-prisma-client";
import { createParcel } from "./actions";

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next-auth", () => ({ getServerSession: vi.fn() }));

const migrationsDir = path.join(process.cwd(), "prisma/migrations");

/** The hand-written creator backfill appended to the add_parcel_member migration. */
function readBackfillSql() {
	const folder = readdirSync(migrationsDir).find((name) =>
		name.endsWith("_add_parcel_member"),
	);
	if (!folder) {
		throw new Error("add_parcel_member migration not found");
	}
	const sql = readFileSync(
		path.join(migrationsDir, folder, "migration.sql"),
		"utf8",
	);
	const start = sql.indexOf('INSERT INTO "ParcelMember"');
	if (start === -1) {
		throw new Error("Backfill statement not found");
	}
	return sql.slice(start);
}

describe("[Integration] parcel members", () => {
	let testPrisma: PrismaClient;

	beforeEach(async () => {
		testPrisma = getTestPrisma();
		await cleanDatabase();
	});

	test("createParcel links the creator as a member", async () => {
		const user = await testPrisma.user.create({
			data: { email: "creator@example.com", isAuthorized: true },
		});
		vi.mocked(getServerSession).mockResolvedValue({
			expires: new Date(Date.now() + 60_000).toISOString(),
			user: { ...user, locale: "en" },
		});

		const formData = new FormData();
		formData.set("name", "New vineyard");
		formData.set("type", "VINEYARD");
		formData.set(
			"boundary",
			JSON.stringify([
				{ lat: 44.1, lng: 9.7 },
				{ lat: 44.1, lng: 9.701 },
				{ lat: 44.101, lng: 9.701 },
				{ lat: 44.101, lng: 9.7 },
			]),
		);
		const { parcel } = await createParcel(formData);

		const members = await testPrisma.parcelMember.findMany({
			where: { parcelId: parcel.id },
		});
		expect(members.map((member) => member.userId)).toEqual([user.id]);
	});

	test("the migration backfill links every parcel to its creator once", async () => {
		const { testUser, testParcel } = await seedTestData();
		const orphanParcel = await testPrisma.parcel.create({
			data: {
				name: "Parcel created before memberships",
				latitude: 44,
				longitude: 9,
				width: 10,
				height: 10,
				userId: testUser.id,
			},
		});

		await testPrisma.$executeRawUnsafe(readBackfillSql());

		const members = await testPrisma.parcelMember.findMany();
		expect(
			members
				.map(({ parcelId, userId }) => ({ parcelId, userId }))
				.sort((a, b) => a.parcelId.localeCompare(b.parcelId)),
		).toEqual(
			[testParcel.id, orphanParcel.id]
				.sort((a, b) => a.localeCompare(b))
				.map((parcelId) => ({ parcelId, userId: testUser.id })),
		);
	});
});
