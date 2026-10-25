// Recomputes the substance totals, e.g. after linking or unlinking a parcel member in
// Supabase (design-docs/shared-parcels.md). Every user and parcel, or only one user's
// member parcels and their members:
//   npm run aggregations:rebuild [-- --user <email>] [--year <yyyy>]
import { rebuildSubstanceAggregations } from "../lib/update-substance-aggregations/core";
import { prisma } from "../lib/prisma";
import { parseRebuildAggregationsArgs } from "./rebuild-aggregations-args";

async function main() {
	const { user: email, year } = parseRebuildAggregationsArgs(
		process.argv.slice(2),
	);

	try {
		const user = email
			? await prisma.user.findUniqueOrThrow({
					where: { email },
					select: { id: true },
				})
			: null;
		await rebuildSubstanceAggregations(prisma, year, { userId: user?.id });
		console.info(
			`✅ Aggregations rebuilt for ${email ?? "every user"}, year ${year}`,
		);
	} catch (error) {
		console.error("❌ Error:", error);
		process.exitCode = 1;
	} finally {
		await prisma.$disconnect();
	}
}

main();
