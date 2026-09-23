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
import { useId } from "react";

ChartJS.register(
	CategoryScale,
	LinearScale,
	PointElement,
	LineElement,
	Title,
	Tooltip,
	Legend,
);

/** Fixed chart area height — keep in sync with skeletons to avoid CLS. */
export const CHART_HEIGHT_PX = 400;

interface ChartWrapperProps {
	data: ChartData<"line">;
	options: ChartOptions<"line">;
	emptyMessage?: string;
	ariaLabel: string;
}

function getChartSummary(data: ChartData<"line">) {
	return {
		labels: data.labels?.map((label) => String(label)) ?? [],
		datasets: data.datasets.map((dataset) => ({
			label: String(dataset.label ?? ""),
			data: dataset.data.map((value) =>
				typeof value === "number" ? value : Number(value),
			),
		})),
	};
}

export function ChartSkeleton() {
	return (
		<div
			className="w-full space-y-4"
			style={{ height: CHART_HEIGHT_PX, minHeight: CHART_HEIGHT_PX }}
		>
			<Skeleton className="h-6 w-48 mx-auto" />
			<Skeleton className="h-[332px] w-full" />
		</div>
	);
}

export function ChartWrapper({
	data,
	options,
	emptyMessage,
	ariaLabel,
}: ChartWrapperProps) {
	const captionId = useId();
	const hasData = data.datasets.some(
		(dataset) =>
			Array.isArray(dataset.data) &&
			dataset.data.some((value) => value !== 0 && value !== null),
	);

	if (!hasData && emptyMessage) {
		return (
			<div
				className="flex items-center justify-center text-center text-gray-500"
				style={{ height: CHART_HEIGHT_PX, minHeight: CHART_HEIGHT_PX }}
			>
				{emptyMessage}
			</div>
		);
	}

	return (
		<figure
			aria-labelledby={captionId}
			className="w-full"
			style={{ height: CHART_HEIGHT_PX, minHeight: CHART_HEIGHT_PX }}
			data-chart-summary={JSON.stringify(getChartSummary(data))}
		>
			<figcaption id={captionId} className="sr-only">
				{ariaLabel}
			</figcaption>
			<div className="h-full w-full">
				<Line
					data={data}
					options={{
						...options,
						maintainAspectRatio: false,
					}}
				/>
			</div>
		</figure>
	);
}
