import { PrismaClient } from "@prisma/client";

interface ReferenceDataClient {
	disease: PrismaClient["disease"];
	product: PrismaClient["product"];
	productApplication: PrismaClient["productApplication"];
	substance: PrismaClient["substance"];
	substanceDose: PrismaClient["substanceDose"];
}

export async function cleanReferenceData(db: ReferenceDataClient) {
	await db.substanceDose.deleteMany();
	await db.productApplication.deleteMany();
	await db.substance.deleteMany();
	await db.disease.deleteMany();
	await db.product.deleteMany();
}

export async function seedReferenceData(db: ReferenceDataClient) {
	// Create diseases
	const oidium = await db.disease.create({
		data: {
			name: "Oidium",
			description: "Powdery mildew, a fungal disease affecting grapevines",
			sensitivityMonthMin: 4,
			sensitivityMonthMax: 8,
		},
	});

	const peronospora = await db.disease.create({
		data: {
			name: "Peronospora",
			description: "Downy mildew, a fungal disease affecting grapevines",
			sensitivityMonthMin: 3,
			sensitivityMonthMax: 7,
		},
	});

	const copper = await db.substance.create({
		data: {
			name: "Copper",
			maxDosage: 4, // kg/ha/year
			diseases: {
				connect: [{ id: peronospora.id }],
			},
		},
	});

	const sulfur = await db.substance.create({
		data: {
			name: "Sulfur",
			maxDosage: 10, // kg/ha/year
			diseases: {
				connect: [{ id: oidium.id }],
			},
		},
	});

	// create products
	const MAX_APPLICATIONS = 6;
	const copperProduct = await db.product.create({
		data: {
			name: "Pasta cafaro",
			brand: "Pasta cafaro",
			maxApplications: MAX_APPLICATIONS,
			daysBetweenApplications: 7, // Source: product label
			composition: {
				create: [{ substanceId: copper.id, dose: 25 }],
			},
		},
	});

	const MAX_APPLICATIONS_SULFUR = 10;
	const sulfurProduct = await db.product.create({
		data: {
			name: "Zolfo tiovit",
			brand: "Zolfo tiovit",
			maxApplications: MAX_APPLICATIONS_SULFUR,
			daysBetweenApplications: 7, // Source: https://www.psm.admin.ch/it/produkte/18
			composition: {
				create: [{ substanceId: sulfur.id, dose: 80 }],
			},
		},
	});

	return {
		copper,
		copperProduct,
		oidium,
		peronospora,
		sulfur,
		sulfurProduct,
	};
}

async function main() {
	const prisma = new PrismaClient();

	// Delete existing data
	console.log("Deleting existing data...");
	try {
		await cleanReferenceData(prisma);
		console.log("Existing data deleted.");

		const { copper, oidium, peronospora, sulfur } =
			await seedReferenceData(prisma);

		console.log("Seed data created:");
		console.log("Diseases:", { oidium, peronospora });
		console.log("Substances:", { copper, sulfur });
	} finally {
		await prisma.$disconnect();
	}
}

const isSeedScript = process.argv.some(
	(arg) => arg.endsWith("prisma/seed.ts") || arg.endsWith("prisma/seed.js"),
);

if (isSeedScript) {
	main().catch((e) => {
		console.error("Error seeding database:", e);
		process.exit(1);
	});
}
