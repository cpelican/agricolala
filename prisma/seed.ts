import {
	PrismaClient,
	ProductDoseUnit,
	SubstanceLimitUnit,
} from "@prisma/client";

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
	const [oidium, peronospora] = await Promise.all([
		db.disease.create({
			data: {
				name: "Oidium",
				description: "Powdery mildew, a fungal disease affecting grapevines",
				sensitivityMonthMin: 4,
				sensitivityMonthMax: 8,
			},
		}),
		db.disease.create({
			data: {
				name: "Peronospora",
				description: "Downy mildew, a fungal disease affecting grapevines",
				sensitivityMonthMin: 3,
				sensitivityMonthMax: 7,
			},
		}),
	]);

	const [copper, sulfur, orangeOil] = await Promise.all([
		db.substance.create({
			data: {
				name: "Copper",
				maxDosage: 4, // kg/ha/year
				maxDosageUnitPerAreaUnit: SubstanceLimitUnit.KG_PER_HA,
				diseases: {
					connect: [{ id: peronospora.id }],
				},
			},
		}),
		db.substance.create({
			data: {
				name: "Sulfur",
				maxDosage: 40, // kg/ha/year
				maxDosageUnitPerAreaUnit: SubstanceLimitUnit.KG_PER_HA,
				diseases: {
					connect: [{ id: oidium.id }],
				},
			},
		}),
		db.substance.create({
			data: {
				name: "Olio essenziale di arancio dolce",
				maxDosage: 10, // kg/ha/year
				maxDosageUnitPerAreaUnit: SubstanceLimitUnit.KG_PER_HA,
				diseases: {
					connect: [{ id: oidium.id }, { id: peronospora.id }],
				},
			},
		}),
	]);

	// create products
	const MAX_APPLICATIONS = 6;
	const copperProduct = await db.product.create({
		data: {
			name: "Pasta cafaro",
			brand: "Pasta cafaro",
			doseUnit: ProductDoseUnit.GRAM,
			maxApplications: MAX_APPLICATIONS,
			daysBetweenApplications: 7, // Source: product label
			composition: {
				create: [{ substanceId: copper.id, dose: 25 }],
			},
		},
	});

	await db.product.create({
		data: {
			name: "OxyFlow",
			brand: "OxyFlow",
			doseUnit: ProductDoseUnit.MILLILITER,
			productLiterToKiloGramConversionRate: 1,
			maxApplications: MAX_APPLICATIONS,
			composition: {
				create: [
					{ substanceId: copper.id, dose: 10 },
					{ substanceId: sulfur.id, dose: 30 },
				],
			},
		},
	});

	const MAX_APPLICATIONS_SULFUR = 10;
	const sulfurProduct = await db.product.create({
		data: {
			name: "Zolfo tiovit",
			brand: "Zolfo tiovit",
			doseUnit: ProductDoseUnit.GRAM,
			maxApplications: MAX_APPLICATIONS_SULFUR,
			daysBetweenApplications: 7, // Source: https://www.psm.admin.ch/it/produkte/18
			composition: {
				create: [{ substanceId: sulfur.id, dose: 80 }],
			},
		},
	});

	const MAX_APPS_ORANGE = 6;
	await db.product.create({
		data: {
			name: "Olio essenziale di arancio dolce",
			brand: "Olio essenziale di arancio dolce",
			doseUnit: ProductDoseUnit.MILLILITER,
			productLiterToKiloGramConversionRate: 0.9,
			maxApplications: MAX_APPS_ORANGE,
			composition: {
				create: [{ substanceId: orangeOil.id, dose: 100 }],
			},
		},
	});

	return {
		copper,
		orangeOil,
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

		const { copper, oidium, orangeOil, peronospora, sulfur } =
			await seedReferenceData(prisma);

		console.log("Seed data created:");
		console.log("Diseases:", { oidium, peronospora });
		console.log("Substances:", { copper, sulfur, orangeOil });
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
