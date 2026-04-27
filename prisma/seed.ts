import {
	PrismaClient,
	ProductDoseUnit,
	SubstanceLimitUnit,
} from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
	// Delete existing data
	console.log("Deleting existing data...");
	await prisma.substanceDose.deleteMany();
	await prisma.productApplication.deleteMany();
	await prisma.substance.deleteMany();
	await prisma.disease.deleteMany();
	await prisma.product.deleteMany();
	console.log("Existing data deleted.");

	// Create diseases
	const oidium = await prisma.disease.create({
		data: {
			name: "Oidium",
			description: "Powdery mildew, a fungal disease affecting grapevines",
			sensitivityMonthMin: 4,
			sensitivityMonthMax: 8,
		},
	});

	const peronospora = await prisma.disease.create({
		data: {
			name: "Peronospora",
			description: "Downy mildew, a fungal disease affecting grapevines",
			sensitivityMonthMin: 3,
			sensitivityMonthMax: 7,
		},
	});

	// Create substances
	const copper = await prisma.substance.create({
		data: {
			name: "Copper",
			maxDosage: 4,
			maxDosageUnitPerAreaUnit: SubstanceLimitUnit.KG_PER_HA,
			diseases: {
				connect: [{ id: peronospora.id }],
			},
		},
	});

	const sulfur = await prisma.substance.create({
		data: {
			name: "Sulfur",
			maxDosage: 10,
			maxDosageUnitPerAreaUnit: SubstanceLimitUnit.KG_PER_HA,
			diseases: {
				connect: [{ id: oidium.id }],
			},
		},
	});

	const orangeOil = await prisma.substance.create({
		data: {
			name: "Olio essenziale di arancio dolce",
			maxDosage: 10,
			maxDosageUnitPerAreaUnit: SubstanceLimitUnit.KG_PER_HA,
			diseases: {
				connect: [{ id: oidium.id }, { id: peronospora.id }],
			},
		},
	});

	// create products
	const MAX_APPLICATIONS = 6;
	await prisma.product.create({
		data: {
			name: "Pasta cafaro",
			brand: "Pasta cafaro",
			doseUnit: ProductDoseUnit.GRAM,
			maxApplications: MAX_APPLICATIONS,
			composition: {
				create: [{ substanceId: copper.id, dose: 25.0 }],
			},
		},
	});

	await prisma.product.create({
		data: {
			name: "OxyFlow",
			brand: "OxyFlow",
			doseUnit: ProductDoseUnit.MILLILITER,
			productLiterToKiloGramConversionRate: 1,
			maxApplications: MAX_APPLICATIONS,
			composition: {
				create: [
					{
						substanceId: copper.id,
						dose: 10.0,
					},
					{
						substanceId: sulfur.id,
						dose: 30.0,
					},
				],
			},
		},
	});
	const MAX_APPLICATIONS_SULFUR = 10;
	await prisma.product.create({
		data: {
			name: "Zolfo tiovit",
			brand: "Zolfo tiovit",
			doseUnit: ProductDoseUnit.GRAM,
			maxApplications: MAX_APPLICATIONS_SULFUR,
			composition: {
				create: [{ substanceId: sulfur.id, dose: 80.0 }],
			},
		},
	});

	const MAX_APPS_ORANGE = 6;
	await prisma.product.create({
		data: {
			name: "Olio essenziale di arancio dolce",
			brand: "Olio essenziale di arancio dolce",
			doseUnit: ProductDoseUnit.MILLILITER,
			productLiterToKiloGramConversionRate: 0.9,
			maxApplications: MAX_APPS_ORANGE,
			composition: {
				create: [
					{
						substanceId: orangeOil.id,
						dose: 100.0,
					},
				],
			},
		},
	});

	console.log("Seed data created:");
	console.log("Diseases:", { oidium, peronospora });
	console.log("Substances:", { copper, sulfur, orangeOil });
}

main()
	.catch((e) => {
		console.error("Error seeding database:", e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
