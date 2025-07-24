import { updateSubstanceAggregations } from "../lib/update-substance-aggregations";
import { prisma } from "../lib/prisma";

async function main() {
	const userId = process.argv[2]; // Get from command line
	const year = parseInt(process.argv[3]) || new Date().getFullYear();

	if (!userId) {
		console.error("Usage: npm run populate-aggregations <userId> [year]");
		process.exit(1);
	}

	try {
		await updateSubstanceAggregations(userId, year);
		console.info(`✅ Aggregations updated for user ${userId}, year ${year}`);
	} catch (error) {
		console.error("❌ Error:", error);
	} finally {
		await prisma.$disconnect();
	}
}

main();
