"use client";

import dynamic from "next/dynamic";
import { useSubstances } from "@/contexts/cached-data-context";
import type { SubstanceData } from "../types";
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

interface SubstanceChartProps {
	data: SubstanceData[];
}

const months = [
	"Jan",
	"Feb",
	"Mar",
	"Apr",
	"May",
	"Jun",
	"Jul",
	"Aug",
	"Sep",
	"Oct",
	"Nov",
	"Dec",
];

export function SubstanceChart({ data }: SubstanceChartProps) {
	const { t } = useTranslations();
	const substances = useSubstances();
	const colors = substances.reduce<Record<string, string>>((acc, substance) => {
		acc[substance.name] = substance.color;
		return acc;
	}, {});

	const chartData: ChartData<"line"> = {
		labels: months,
		datasets: data.map((substance) => ({
			label: substance.name,
			data: substance.monthlyData,
			borderColor: colors[substance.name],
			backgroundColor: colors[substance.name],
			tension: 0.1,
		})),
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
				text: "Monthly Substance Usage (kg/ha)",
			},
		},
		scales: {
			y: {
				beginAtZero: true,
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
