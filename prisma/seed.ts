import { PrismaClient } from "@prisma/client";

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
		},
	});

	const peronospora = await prisma.disease.create({
		data: {
			name: "Peronospora",
			description: "Downy mildew, a fungal disease affecting grapevines",
		},
	});

	// Create substances
	const copper = await prisma.substance.create({
		data: {
			name: "Copper",
			maxDosage: 4, // kg/ha/year
			diseases: {
				connect: [{ id: peronospora.id }],
			},
		},
	});

	const sulfur = await prisma.substance.create({
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
	const rame = await prisma.product.create({
		data: {
			name: "Pasta cafaro",
			brand: "Pasta cafaro",
			maxApplications: MAX_APPLICATIONS,
			composition: {
				create: [{ substanceId: copper.id, dose: 25.0 }],
			},
		},
	});
	const MAX_APPLICATIONS_SULFUR = 10;
	const zolfo = await prisma.product.create({
		data: {
			name: "Zolfo tiovit",
			brand: "Zolfo tiovit",
			maxApplications: MAX_APPLICATIONS_SULFUR,
			composition: {
				create: [{ substanceId: sulfur.id, dose: 80.0 }],
			},
		},
	});

	console.log("Seed data created:");
	console.log("Diseases:", { oidium, peronospora });
	console.log("Substances:", { copper, sulfur });
}

main()
	.catch((e) => {
		console.error("Error seeding database:", e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
