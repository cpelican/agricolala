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

const sum = (values: number[]) => values.reduce((acc, value) => acc + value, 0);

/**
 * Usage per year, restricted to the same period (Jan 1 → end of the current
 * month) so past seasons compare fairly with the ongoing one.
 * Per-ha values are scaled by the share of pure active substance applied in
 * that period, as `monthlyData` is stored in grams, not grams per ha.
 */
export const getAllYearsSubstanceAggregations = cache(
	async (userId: string) => {
		const aggregations = await prisma.userSubstanceAggregation.findMany({
			where: { userId },
			orderBy: [{ year: "asc" }, { substanceName: "asc" }],
		});

		const lastMonthIndex = new Date().getMonth();

		const yearData: Record<
			number,
			Record<
				string,
				Pick<
					UserSubstanceAggregation,
					"totalUsedOfPureActiveSubstance" | "year"
				> & {
					totalUsedOfPureActiveSubstancePerHaGrams: number;
				}
			>
		> = {};

		for (const agg of aggregations) {
			if (!yearData[agg.year]) {
				yearData[agg.year] = {};
			}
			const yearTotal = sum(agg.monthlyData);
			const samePeriodTotal = sum(agg.monthlyData.slice(0, lastMonthIndex + 1));
			const samePeriodShare = yearTotal > 0 ? samePeriodTotal / yearTotal : 0;

			yearData[agg.year][agg.substanceName] = {
				totalUsedOfPureActiveSubstance: samePeriodTotal,
				totalUsedOfPureActiveSubstancePerHaGrams:
					agg.totalUsedOfPureActiveSubstancePerHa * samePeriodShare,
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
