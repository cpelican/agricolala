import type { UserSubstanceAggregation } from "@prisma/client";
import { cache } from "react";
import { prisma } from "./prisma";

export const getCachedSubstanceAggregations = cache(
	async (userId: string, year: number = new Date().getFullYear()) => {
		const aggregations = await prisma.userSubstanceAggregation.findMany({
			where: { userId, year },
			orderBy: { substanceName: "asc" },
		});

		return aggregations.map((agg) => ({
			name: agg.substanceName,
			totalDoseOfProduct: agg.totalDoseOfProduct,
			totalUsedOfPureActiveSubstance: agg.totalUsedOfPureActiveSubstance,
			totalUsedOfPureActiveSubstancePerHaGrams:
				agg.totalUsedOfPureActiveSubstancePerHa,
			maxDosage: -1, // Will be filled from substances data
			monthlyData: agg.monthlyData,
			applicationCount: agg.applicationCount,
		}));
	},
);

export const getAllYearsSubstanceAggregations = cache(
	async (userId: string) => {
		const aggregations = await prisma.userSubstanceAggregation.findMany({
			where: { userId },
			orderBy: [{ year: "asc" }, { substanceName: "asc" }],
		});

		const yearData: Record<
			number,
			Record<
				string,
				Pick<
					UserSubstanceAggregation,
					"totalDoseOfProduct" | "totalUsedOfPureActiveSubstance" | "year"
				> & {
					totalUsedOfPureActiveSubstancePerHaGrams: number;
				}
			>
		> = {};

		for (const agg of aggregations) {
			if (!yearData[agg.year]) {
				yearData[agg.year] = {};
			}
			yearData[agg.year][agg.substanceName] = {
				totalDoseOfProduct: agg.totalDoseOfProduct,
				totalUsedOfPureActiveSubstance: agg.totalUsedOfPureActiveSubstance,
				totalUsedOfPureActiveSubstancePerHaGrams:
					agg.totalUsedOfPureActiveSubstancePerHa,
				year: agg.year,
			};
		}

		return yearData;
	},
);

export const getCachedParcelSubstanceAggregations = cache(
	async (parcelId: string, year: number = new Date().getFullYear()) => {
		const aggregations = await prisma.parcelSubstanceAggregation.findMany({
			where: { parcelId, year },
			orderBy: { substanceName: "asc" },
		});

		return aggregations.map((agg) => ({
			name: agg.substanceName,
			totalDoseOfProduct: agg.totalDoseOfProduct,
			totalUsedOfPureActiveSubstance: agg.totalUsedOfPureActiveSubstance,
			totalUsedOfPureActiveSubstancePerHaGrams:
				agg.totalUsedOfPureActiveSubstancePerHa,
			maxDosage: -1, // Will be filled from substances data
			monthlyData: agg.monthlyData,
			applicationCount: agg.applicationCount,
		}));
	},
);
