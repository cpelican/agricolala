"use client";

import dynamic from "next/dynamic";
import { useSubstances } from "@/contexts/cached-data-context";
import { useTranslations } from "@/contexts/translations-context";
import type { ChartData, ChartOptions } from "chart.js";
import { ChartSkeleton } from "./chart-wrapper";

const ChartWrapper = dynamic(
	() =>
		import("./chart-wrapper").then((mod) => ({ default: mod.ChartWrapper })),
	{
		ssr: false,
		loading: () => <ChartSkeleton />,
	},
);

interface SubstanceYearlyChartProps {
	allYearsData: Record<
		number,
		Record<
			string,
			{
				totalDoseOfProduct: number;
				totalUsedOfPureActiveSubstance: number;
				totalUsedOfPureActiveSubstancePerHa: number;
				year: number;
			}
		>
	>;
}

export function SubstanceYearlyChart({
	allYearsData,
}: SubstanceYearlyChartProps) {
	const { t, getSubstanceTranslation } = useTranslations();
	const substances = useSubstances();
	const colors = substances.reduce<Record<string, string>>((acc, substance) => {
		acc[substance.name] = substance.color;
		return acc;
	}, {});

	// Get all years sorted
	const years = Object.keys(allYearsData)
		.map(Number)
		.sort((a, b) => a - b);

	// Get all unique substance names across all years
	const substanceNames = new Set<string>();
	for (const yearData of Object.values(allYearsData)) {
		for (const substanceName of Object.keys(yearData)) {
			substanceNames.add(substanceName);
		}
	}

	// Build datasets for each substance, filtering out those with less than 2 data points
	const datasets = Array.from(substanceNames)
		.map((substanceName) => {
			const data = years.map((year) => {
				const yearData = allYearsData[year];
				const substanceData = yearData?.[substanceName];
				return substanceData?.totalUsedOfPureActiveSubstancePerHa ?? 0;
			});

			// Count non-zero data points
			const nonZeroDataPoints = data.filter((value) => value > 0).length;

			// Only include substances with at least 2 data points
			if (nonZeroDataPoints < 2) {
				return null;
			}

			return {
				label: getSubstanceTranslation(substanceName),
				data,
				borderColor: colors[substanceName] || "rgb(182, 182, 182)",
				backgroundColor: colors[substanceName] || "rgb(182, 182, 182)",
				tension: 0.1,
			};
		})
		.filter(
			(dataset): dataset is NonNullable<typeof dataset> => dataset !== null,
		);

	const chartData: ChartData<"line"> = {
		labels: years.map((year) => year.toString()),
		datasets,
	};

	const options: ChartOptions<"line"> = {
		responsive: true,
		aspectRatio: 1.2,
		plugins: {
			legend: {
				position: "top" as const,
			},
			title: {
				display: true,
				text: t("substances.yearlyUsageTitle"),
			},
		},
		scales: {
			y: {
				beginAtZero: true,
				title: {
					display: true,
					text: t("substances.kgPerHa"),
				},
			},
			x: {
				title: {
					display: true,
					text: t("substances.year"),
				},
			},
		},
	};

	return (
		<ChartWrapper
			data={chartData}
			options={options}
			emptyMessage={t("substances.noTreatmentData")}
		/>
	);
}
