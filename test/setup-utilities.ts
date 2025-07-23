import { getTestPrisma } from "./test-prisma-client";

export async function cleanDatabase() {
	const testPrisma = getTestPrisma();
	try {
		console.log("Starting database cleanup...");

		// Get all tables in the public schema
		const tablenames = await testPrisma.$queryRaw<Array<{ tablename: string }>>`
      SELECT tablename FROM pg_tables WHERE schemaname='public'
    `;

		const tables = tablenames
			.map(({ tablename }) => tablename)
			.filter((name) => name !== "_prisma_migrations")
			.map((name) => `"public"."${name}"`);

		if (tables.length === 0) {
			console.error("No tables found to clean");
			return;
		}

		// Disable foreign key checks temporarily
		await testPrisma.$executeRawUnsafe(
			"SET session_replication_role = replica;",
		);

		// Truncate all tables
		const truncateQuery = `TRUNCATE TABLE ${tables.join(", ")} CASCADE;`;
		await testPrisma.$executeRawUnsafe(truncateQuery);

		// Re-enable foreign key checks
		await testPrisma.$executeRawUnsafe(
			"SET session_replication_role = DEFAULT;",
		);

		// Verify cleanup by checking if tables are empty
		for (const table of tables) {
			const tableName = table.replace(/"/g, "");
			try {
				const countResult = await testPrisma.$queryRawUnsafe(
					`SELECT COUNT(*) as count FROM ${table}`,
				);
				const count = (countResult as any)[0]?.count;
				if (count > 0) {
					console.error(
						`Table ${tableName} still has ${count} records after cleanup`,
					);
				}
			} catch (error) {
				console.error(`Error verifying table ${tableName}:`, error);
				throw error;
			}
		}

		console.log("Database cleaned successfully - all tables are empty");
	} catch (error) {
		console.error("Error cleaning database:", error);
		throw error;
	}
}

export async function seedTestData() {
	const testPrisma = getTestPrisma();
	// Test diseases
	const oidium = await testPrisma.disease.create({
		data: {
			name: "Oidium",
			description: "Powdery mildew, a fungal disease affecting grapevines",
		},
	});

	const peronospora = await testPrisma.disease.create({
		data: {
			name: "Peronospora",
			description: "Downy mildew, a fungal disease affecting grapevines",
		},
	});

	// Test substances
	const copper = await testPrisma.substance.create({
		data: {
			name: "Copper",
			maxDosage: 4,
			diseases: {
				connect: [{ id: peronospora.id }],
			},
		},
	});

	const sulfur = await testPrisma.substance.create({
		data: {
			name: "Sulfur",
			maxDosage: 10,
			diseases: {
				connect: [{ id: oidium.id }],
			},
		},
	});

	// Test products
	const copperProduct = await testPrisma.product.create({
		data: {
			name: "Test Copper Product",
			brand: "Test Brand",
			maxApplications: 6,
			daysBetweenApplications: 30,
			composition: {
				create: [{ substanceId: copper.id, dose: 25.0 }],
			},
		},
	});

	const sulfurProduct = await testPrisma.product.create({
		data: {
			name: "Test Sulfur Product",
			brand: "Test Brand",
			maxApplications: 10,
			daysBetweenApplications: 7,
			composition: {
				create: [{ substanceId: sulfur.id, dose: 80.0 }],
			},
		},
	});

	// Test user
	const testUser = await testPrisma.user.create({
		data: {
			email: "test@example.com",
			name: "Test User",
			isAuthorized: true,
		},
	});

	// Test parcel
	const testParcel = await testPrisma.parcel.create({
		data: {
			name: "Test Vineyard",
			latitude: 44.0998,
			longitude: 9.7387,
			width: 100,
			height: 50,
			type: "VINEYARD",
			userId: testUser.id,
		},
	});

	// Past treatment (30 days ago)
	const pastTreatment = await testPrisma.treatment.create({
		data: {
			parcelId: testParcel.id,
			userId: testUser.id,
			status: "DONE",
			appliedDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
			waterDose: 10,
			diseaseIds: [peronospora.id, oidium.id],
			productApplications: {
				create: [
					{
						productId: copperProduct.id,
						dose: 5,
					},
					{
						productId: sulfurProduct.id,
						dose: 3,
					},
				],
			},
		},
	});

	return {
		testUser,
		testParcel,
		pastTreatment,
		copperProduct,
		sulfurProduct,
		oidium,
		peronospora,
	};
}
