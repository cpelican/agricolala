"use client";

import {
	CategoryScale,
	Chart as ChartJS,
	Legend,
	LinearScale,
	LineElement,
	PointElement,
	Title,
	Tooltip,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { useSubstances } from "@/contexts/cached-data-context";
import type { SubstanceData } from "./types";
import { useTranslations } from "@/lib/translations";

ChartJS.register(
	CategoryScale,
	LinearScale,
	PointElement,
	LineElement,
	Title,
	Tooltip,
	Legend,
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
	const colors = substances.reduce(
		(acc, substance) => {
			acc[substance.name] = substance.color;
			return acc;
		},
		{} as Record<string, string>,
	);

	const chartData = {
		labels: months,
		datasets: data.map((substance) => ({
			label: substance.name,
			data: substance.monthlyData,
			borderColor: colors[substance.name],
			backgroundColor: colors[substance.name],
			tension: 0.1,
		})),
	};

	const options = {
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

	if (data.length === 0) {
		return (
			<div className="text-center py-8 text-gray-500">
				{t("substances.noTreatmentData")}
			</div>
		);
	}

	return <Line data={chartData} options={options} />;
}
