import { PrismaClient, CultureType, TreatmentStatus } from "@prisma/client";
import { dirname, join } from "node:path";
import { mkdir } from "node:fs/promises";
import { seedReferenceData } from "../../prisma/seed";

const prisma = new PrismaClient();

export const authStatePath = join(process.cwd(), "e2e", ".auth", "user.json");

export const e2eUser = {
	email: process.env.TEST_USER_EMAIL ?? "playwright@agricolala.test",
	password: process.env.TEST_USER_PASSWORD ?? "playwright-local-password",
} as const;

export const seededParcel = {
	name: "E2E Vineyard",
	latitude: 44.1461,
	longitude: 9.6543,
	altitude: 120,
	width: 20,
	height: 20,
} as const;

const APRIL_TREATMENT_DAYS = [2, 9, 16, 23] as const;
const COPPER_PRODUCT_COPPER_FRACTION = 0.25;
const TYPICAL_SEASON_TREATMENT_COUNT = 10;
const MAX_COPPER_KG_PER_HA = 4;
const PARCEL_AREA_M2 = seededParcel.width * seededParcel.height;
const maxCopperGramsPerSeason =
	(MAX_COPPER_KG_PER_HA * 1_000 * PARCEL_AREA_M2) / 10_000;
// 10 x 64g product at 25% copper on 400m2 = 160g copper/year, or 4kg/ha.
// This fixture seeds only 4 April treatments, so the dashboard starts at 1.6kg/ha.
const COPPER_PRODUCT_DOSE_GRAMS =
	maxCopperGramsPerSeason /
	TYPICAL_SEASON_TREATMENT_COUNT /
	COPPER_PRODUCT_COPPER_FRACTION;
const totalCopperProductDoseGrams =
	APRIL_TREATMENT_DAYS.length * COPPER_PRODUCT_DOSE_GRAMS;
const totalCopperGrams =
	totalCopperProductDoseGrams * COPPER_PRODUCT_COPPER_FRACTION;
const totalCopperPerHaGrams = (totalCopperGrams * 10_000) / PARCEL_AREA_M2;

export const expectedCopperChartKg = [
	0,
	0,
	0,
	totalCopperGrams / 1_000,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
] as const;

export async function ensureAuthStateDirectory() {
	await mkdir(dirname(authStatePath), { recursive: true });
}

function assertSafeE2eDatabase() {
	const databaseUrl = process.env.DATABASE_URL ?? "";
	const { databaseName, hostname, isSafe } =
		parseE2eDatabaseSafety(databaseUrl);

	if (!isSafe) {
		throw new Error(
			`Refusing to reset database host "${hostname}" and database "${databaseName}". Playwright e2e resets are limited to localhost/127.0.0.1 on port 5434, local database names containing "e2e", or the "postgres-e2e" Docker host.`,
		);
	}
}

function parseE2eDatabaseSafety(databaseUrl: string) {
	try {
		const url = new URL(databaseUrl);
		const hostname = url.hostname.toLowerCase().replace(/^\[|\]$/g, "");
		const databaseName = decodeURIComponent(url.pathname.replace(/^\//, ""));
		const protocol = url.protocol.replace(":", "");
		const localHosts = new Set(["localhost", "127.0.0.1", "::1"]);
		const dockerE2eHosts = new Set(["postgres-e2e"]);
		const isPostgres = protocol === "postgresql" || protocol === "postgres";
		const isLocalE2ePort = localHosts.has(hostname) && url.port === "5434";
		const isLocalE2eDatabase =
			localHosts.has(hostname) && databaseName.toLowerCase().includes("e2e");
		const isDockerE2eHost = dockerE2eHosts.has(hostname);

		return {
			databaseName,
			hostname,
			isSafe:
				isPostgres && (isLocalE2ePort || isLocalE2eDatabase || isDockerE2eHost),
		};
	} catch {
		return {
			databaseName: "unknown",
			hostname: "invalid-url",
			isSafe: false,
		};
	}
}

export async function seedE2eData() {
	assertSafeE2eDatabase();

	const year = new Date().getFullYear();
	const monthlyCopperGrams = [
		0,
		0,
		0,
		totalCopperGrams,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
	] as const;

	await prisma.$transaction(async (tx) => {
		await tx.productApplication.deleteMany();
		await tx.treatment.deleteMany();
		await tx.parcelSubstanceAggregation.deleteMany();
		await tx.userSubstanceAggregation.deleteMany();
		await tx.parcel.deleteMany();
		await tx.session.deleteMany();
		await tx.account.deleteMany();
		await tx.user.deleteMany();
		await tx.substanceDose.deleteMany();
		await tx.product.deleteMany();
		await tx.disease.deleteMany();
		await tx.substance.deleteMany();

		const user = await tx.user.create({
			data: {
				email: e2eUser.email,
				emailVerified: new Date(),
				isAuthorized: true,
				locale: "en",
				name: "Playwright User",
				tosAcceptedAt: new Date(),
			},
		});

		const { copper, copperProduct, peronospora } = await seedReferenceData(tx);

		const parcel = await tx.parcel.create({
			data: {
				...seededParcel,
				type: CultureType.VINEYARD,
				userId: user.id,
			},
		});

		for (const day of APRIL_TREATMENT_DAYS) {
			const treatment = await tx.treatment.create({
				data: {
					appliedDate: new Date(Date.UTC(year, 3, day, 12)),
					diseaseIds: [peronospora.id],
					parcelId: parcel.id,
					status: TreatmentStatus.DONE,
					userId: user.id,
					waterDose: 10,
				},
			});

			await tx.productApplication.create({
				data: {
					dose: COPPER_PRODUCT_DOSE_GRAMS,
					productId: copperProduct.id,
					treatmentId: treatment.id,
				},
			});
		}

		await tx.userSubstanceAggregation.create({
			data: {
				applicationCount: 4,
				monthlyData: [...monthlyCopperGrams],
				substanceId: copper.id,
				substanceName: copper.name,
				totalDoseOfProduct: totalCopperProductDoseGrams,
				totalUsedOfPureActiveSubstance: totalCopperGrams,
				totalUsedOfPureActiveSubstancePerHa: totalCopperPerHaGrams,
				userId: user.id,
				year,
			},
		});

		await tx.parcelSubstanceAggregation.create({
			data: {
				applicationCount: 4,
				monthlyData: [...monthlyCopperGrams],
				parcelId: parcel.id,
				substanceId: copper.id,
				substanceName: copper.name,
				totalDoseOfProduct: totalCopperProductDoseGrams,
				totalUsedOfPureActiveSubstance: totalCopperGrams,
				totalUsedOfPureActiveSubstancePerHa: totalCopperPerHaGrams,
				year,
			},
		});
	});
}

export async function disconnectE2ePrisma() {
	await prisma.$disconnect();
}
