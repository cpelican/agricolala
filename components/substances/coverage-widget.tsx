"use client";

import { useState } from "react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { useTranslations } from "@/contexts/translations-context";
import {
	type CoverageWidgetData,
	type SubstanceCoverage,
	type CoverageForecastDay,
} from "@/components/types";
import { COPPER_EFFICACY_THRESHOLD_MG_M2 } from "@/lib/coverage-helpers";

function coverageColor(percent: number): string {
	if (percent >= 60) return "text-green-600";
	if (percent >= 30) return "text-yellow-600";
	return "text-red-600";
}

function progressBarColor(percent: number): string {
	if (percent >= 60) return "bg-green-500";
	if (percent >= 30) return "bg-yellow-500";
	return "bg-red-500";
}

function ForecastRow({ forecast }: { forecast: CoverageForecastDay[] }) {
	const { t } = useTranslations();
	if (forecast.length === 0) return null;

	return (
		<div className="mt-3 pt-3 border-t">
			<p className="text-xs font-medium text-muted-foreground mb-2">
				{t("coverage.forecast")}
			</p>
			<div className="grid grid-cols-3 gap-2">
				{forecast.map((day, i) => {
					const date = new Date(day.date);
					const dayName = date.toLocaleDateString(undefined, {
						weekday: "short",
					});
					return (
						<div
							key={i}
							className="rounded-md border p-2 text-center text-xs space-y-0.5"
						>
							<p className="font-medium">{dayName}</p>
							<p className="text-muted-foreground">
								{Math.round(day.projectedWeightedRemainingGPerHa)}{" "}
								{t("coverage.remaining")}
							</p>
							{day.precipitationMm > 0 && (
								<p className="text-blue-500">
									+{day.precipitationMm.toFixed(1)} {t("coverage.mm")}
								</p>
							)}
						</div>
					);
				})}
			</div>
		</div>
	);
}

function SubstanceCoverageCard({
	substance,
}: {
	substance: SubstanceCoverage;
}) {
	const { t, getSubstanceTranslation } = useTranslations();
	const [expanded, setExpanded] = useState(false);
	const translatedName = getSubstanceTranslation(substance.substanceName);
	const pct =
		substance.coveragePercent !== null
			? Math.round(substance.coveragePercent)
			: null;
	const refDose = substance.fullDoseGPerHa ?? substance.weightedInitialGPerHa;
	const refDoseLabel =
		substance.fullDoseGPerHa != null
			? t("coverage.fullDose")
			: t("coverage.initial");

	return (
		<Card>
			<CardContent className="p-4 space-y-3">
				<div className="flex items-start justify-between gap-3">
					<div className="flex items-center gap-2 min-w-0">
						<div
							className="w-3 h-3 rounded-full shrink-0"
							style={{ backgroundColor: substance.color }}
						/>
						<div className="min-w-0">
							<div className="flex items-center gap-2 flex-wrap">
								<h3 className="font-medium">{translatedName}</h3>
								{pct !== null && (
									<span
										className={`text-sm font-semibold ${coverageColor(pct)}`}
									>
										{pct}% {t("coverage.coveragePercent")}
									</span>
								)}
							</div>
							<p className="text-sm text-muted-foreground">
								{Math.round(substance.weightedRemainingGPerHa)}{" "}
								{t("coverage.remaining")} / {Math.round(refDose)} {refDoseLabel}
							</p>
							{substance.leafSurfaceMgPerM2 !== undefined && (
								<p
									className={`text-xs ${
										substance.leafSurfaceMgPerM2 >=
										COPPER_EFFICACY_THRESHOLD_MG_M2
											? "text-green-600"
											: "text-red-600"
									}`}
								>
									{substance.leafSurfaceMgPerM2.toFixed(2)}{" "}
									{t("coverage.leafSurface")} — {t("coverage.copperThreshold")}
								</p>
							)}
						</div>
					</div>
					{pct !== null && (
						<div className="shrink-0 w-16">
							<div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
								<div
									className={`h-full transition-all ${progressBarColor(pct)}`}
									style={{ width: `${pct}%` }}
								/>
							</div>
						</div>
					)}
				</div>

				<ForecastRow forecast={substance.forecast} />

				{substance.parcels.length > 1 && (
					<button
						onClick={() => setExpanded((v) => !v)}
						className="text-xs text-muted-foreground underline underline-offset-2"
					>
						{expanded ? t("coverage.hideDetails") : t("coverage.showDetails")}
					</button>
				)}

				{expanded && (
					<div className="space-y-2 pt-1">
						{substance.parcels.map((p) => (
							<div
								key={p.parcelId}
								className="rounded-md bg-muted/50 px-3 py-2 text-xs space-y-1"
							>
								<div className="flex justify-between items-center">
									<span className="font-medium">{p.parcelName}</span>
									{p.coveragePercent !== null && (
										<span
											className={`font-semibold ${coverageColor(Math.round(p.coveragePercent))}`}
										>
											{Math.round(p.coveragePercent)}%
										</span>
									)}
								</div>
								<p className="text-muted-foreground">
									{Math.round(p.remainingDoseGPerHa)} {t("coverage.remaining")}{" "}
									/ {Math.round(p.initialDoseGPerHa)} {t("coverage.initial")}
								</p>
								<p className="text-muted-foreground">
									{p.rainSinceLastTreatmentMm.toFixed(1)} {t("coverage.mm")}{" "}
									{t("coverage.rainSince")}
								</p>
							</div>
						))}
					</div>
				)}
			</CardContent>
		</Card>
	);
}

interface CoverageWidgetProps {
	data: CoverageWidgetData;
}

export function CoverageWidget({ data }: CoverageWidgetProps) {
	const { t } = useTranslations();

	return (
		<div className="space-y-3">
			<Card className="bg-card">
				<CardHeader>
					<CardTitle>{t("coverage.title")}</CardTitle>
					<CardDescription>{t("coverage.description")}</CardDescription>
				</CardHeader>
			</Card>

			{!data.hasWeatherData && (
				<p className="text-sm text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-md px-3 py-2">
					{t("coverage.noWeatherData")}
				</p>
			)}
			{data.hasIncompleteWeatherHistory && (
				<p className="text-sm text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-md px-3 py-2">
					{t("coverage.incompleteWeatherData")}
				</p>
			)}

			{data.substances.map((substance) => (
				<SubstanceCoverageCard
					key={substance.substanceName}
					substance={substance}
				/>
			))}
		</div>
	);
}
