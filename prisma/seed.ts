import {
	PrismaClient,
	ProductDoseUnit,
	SubstanceLimitUnit,
} from "@prisma/client";
import {
	DISEASE_STAGE_SENSITIVITY_MATRIX,
	getStageSensitivityRows,
} from "../lib/disease-stage-sensitivity";

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
				stageSensitivities: { create: getStageSensitivityRows("Oidium") },
			},
		}),
		db.disease.create({
			data: {
				name: "Peronospora",
				description: "Downy mildew, a fungal disease affecting grapevines",
				sensitivityMonthMin: 3,
				sensitivityMonthMax: 7,
				stageSensitivities: { create: getStageSensitivityRows("Peronospora") },
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
	const orangeOilProduct = await db.product.create({
		data: {
			name: "Olio essenziale di arancio dolce",
			brand: "Olio essenziale di arancio dolce",
			doseUnit: ProductDoseUnit.MILLILITER,
			productLiterToKiloGramConversionRate: 0.9,
			maxApplications: MAX_APPS_ORANGE,
			composition: {
				// Commercial formulation: 20% sweet orange essential oil.
				create: [{ substanceId: orangeOil.id, dose: 20 }],
			},
		},
	});

	return {
		copper,
		orangeOil,
		orangeOilProduct,
		copperProduct,
		oidium,
		peronospora,
		sulfur,
		sulfurProduct,
	};
}

// Writes the sensitivity matrix for the diseases already in the database without
// wiping anything, so it can run on a database with real treatments (production).
async function upsertDiseaseStageSensitivities(prisma: PrismaClient) {
	for (const name of ["Peronospora", "Oidium"] as const) {
		const disease = await prisma.disease.findUnique({
			where: { name },
			select: { id: true },
		});
		if (!disease) {
			console.warn(`Disease ${name} not found, skipped`);
			continue;
		}
		for (const { stage, level } of getStageSensitivityRows(name)) {
			await prisma.diseaseStageSensitivity.upsert({
				where: { diseaseId_stage: { diseaseId: disease.id, stage } },
				create: { diseaseId: disease.id, stage, level },
				update: { level },
			});
		}
		console.log(
			`${name}: ${Object.keys(DISEASE_STAGE_SENSITIVITY_MATRIX[name]).length} stages written`,
		);
	}
}

async function main() {
	const prisma = new PrismaClient();

	if (process.argv.includes("--stage-sensitivities-only")) {
		try {
			await upsertDiseaseStageSensitivities(prisma);
		} finally {
			await prisma.$disconnect();
		}
		return;
	}

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
