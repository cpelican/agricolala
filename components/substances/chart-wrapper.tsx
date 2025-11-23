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
import type { ChartData, ChartOptions } from "chart.js";
import { Skeleton } from "../ui/skeleton";

ChartJS.register(
	CategoryScale,
	LinearScale,
	PointElement,
	LineElement,
	Title,
	Tooltip,
	Legend,
);

interface ChartWrapperProps {
	data: ChartData<"line">;
	options: ChartOptions<"line">;
	emptyMessage?: string;
}

export function ChartSkeleton() {
	return (
		<div className="flex items-center justify-center h-[400px] w-full">
			<div className="w-full space-y-4">
				<Skeleton className="h-6 w-48 mx-auto" />
				<Skeleton className="h-[300px] w-full" />
			</div>
		</div>
	);
}

export function ChartWrapper({
	data,
	options,
	emptyMessage,
}: ChartWrapperProps) {
	const hasData = data.datasets.some(
		(dataset) =>
			Array.isArray(dataset.data) &&
			dataset.data.some((value) => value !== 0 && value !== null),
	);

	if (!hasData && emptyMessage) {
		return <div className="text-center py-8 text-gray-500">{emptyMessage}</div>;
	}

	return (
		<div className="max-h-[400px] flex justify-center items-center">
			<Line data={data} options={options} />
		</div>
	);
}
