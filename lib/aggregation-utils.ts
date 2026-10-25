import { type PrismaClient } from "@prisma/client";
import { getCachedSubstances } from "./data-fetcher";
import { type SubstanceData } from "@/components/types";

export async function updateUserAggregations(
	prisma: PrismaClient,
	substanceData: SubstanceData[],
	userId: string,
	year: number,
) {
	const substances = await getCachedSubstances();
	const getSubstanceIdBySubstanceName = substances.reduce<
		Record<string, string>
	>((acc, substance) => {
		acc[substance.name] = substance.id;
		return acc;
	}, {});
	await Promise.all(
		substanceData.map((substance) =>
			prisma.userSubstanceAggregation.create({
				data: {
					userId,
					substanceId: getSubstanceIdBySubstanceName[substance.name],
					substanceName: substance.name,
					year,
					totalDoseOfProduct: substance.totalDoseOfProduct,
					totalUsedOfPureActiveSubstance:
						substance.totalUsedOfPureActiveSubstance,
					totalUsedOfPureActiveSubstancePerHa:
						substance.totalUsedOfPureActiveSubstancePerHaGrams,
					monthlyData: substance.monthlyData,
					applicationCount: substance.applicationCount,
				},
			}),
		),
	);
}

export async function updateParcelAggregations(
	prisma: PrismaClient,
	substanceData: SubstanceData[],
	parcelId: string,
	year: number,
) {
	const substances = await getCachedSubstances();
	const getSubstanceIdBySubstanceName = substances.reduce<
		Record<string, string>
	>((acc, substance) => {
		acc[substance.name] = substance.id;
		return acc;
	}, {});
	await Promise.all(
		substanceData.map((substance) =>
			prisma.parcelSubstanceAggregation.create({
				data: {
					parcelId,
					substanceId: getSubstanceIdBySubstanceName[substance.name],
					substanceName: substance.name,
					year,
					totalDoseOfProduct: substance.totalDoseOfProduct,
					totalUsedOfPureActiveSubstance:
						substance.totalUsedOfPureActiveSubstance,
					totalUsedOfPureActiveSubstancePerHa:
						substance.totalUsedOfPureActiveSubstancePerHaGrams,
					monthlyData: substance.monthlyData,
					applicationCount: substance.applicationCount,
				},
			}),
		),
	);
}
