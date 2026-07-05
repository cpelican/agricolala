"use client";

import { type ReactNode } from "react";
import { type CoverageForecastDay, type SubstanceCoverage } from "../types";
import { useTranslations } from "@/contexts/translations-context";
import { COPPER_EFFICACY_THRESHOLD_MG_M2 } from "@/lib/coverage-helpers";
import { AlertTriangle, CheckCircle2, CloudRain } from "lucide-react";

// Presentation-only scale for the leaf-residual gauge (copper). Not a business threshold.
const LEAF_GAUGE_MAX_MG_M2 = 7;
const LEAF_GAUGE_OPTIMAL_MG_M2 = 5;
const LEAF_GAUGE_TICKS = [0, 2.5, 4, LEAF_GAUGE_OPTIMAL_MG_M2, 6, 7];
const LEAF_GAUGE_GRADIENT = [
	{ pos: 0, color: "#ef4444" },
	{ pos: 2.5, color: "#eab308" },
	{ pos: 4, color: "#16a34a" },
	{ pos: 5, color: "#22c55e" },
	{ pos: 6, color: "#4ade80" },
	{ pos: 7, color: "#eab308" },
];

// Presentation-only scale for the dose-residual gauge (substances without a leaf-surface
// metric, e.g. sulfur). 100% = the full-protection anchor dose (FULL_DOSE_G_PER_HA).
const DOSE_GAUGE_MAX_PERCENT = 120;
const DOSE_GAUGE_OPTIMAL_PERCENT = 70;
const DOSE_GAUGE_TICKS = [0, 50, DOSE_GAUGE_OPTIMAL_PERCENT, 100, 120];
const DOSE_GAUGE_GRADIENT = [
	{ pos: 0, color: "#f59e0b" },
	{ pos: 50, color: "#4ade80" },
	{ pos: 70, color: "#22c55e" },
	{ pos: 90, color: "#4ade80" },
	{ pos: 100, color: "#f59e0b" },
	{ pos: 120, color: "#ef4444" },
];

export type StatusLevel = "critical" | "warning" | "optimal";

const STATUS_BADGE_STYLES: Record<StatusLevel, string> = {
	critical: "bg-red-50 border-red-200 text-red-600",
	warning: "bg-orange-50 border-orange-200 text-orange-700",
	optimal: "bg-green-50 border-green-200 text-green-700",
};

const STATUS_TEXT_COLOR: Record<StatusLevel, string> = {
	critical: "text-red-600",
	warning: "text-orange-700",
	optimal: "text-green-700",
};

// Status of the dose-residual gauge (non-copper substances): full anchor dose ± an optimal
// band. Below the band is under-protected, above 100% of the anchor is over-application.
function doseStatusLevel(percent: number): StatusLevel {
	if (percent > 100) return "critical";
	if (percent >= 50 && percent <= 90) return "optimal";
	return "warning";
}

// Single source of truth for a substance's status badge, shared by the card header and the
// coverage section body so they never disagree.
export function getCoverageStatus(
	coverage: SubstanceCoverage,
	t: (key: string) => string,
): { level: StatusLevel; label: string } | null {
	if (coverage.leafSurfaceMgPerM2 !== undefined) {
		const isBelow =
			coverage.leafSurfaceMgPerM2 < COPPER_EFFICACY_THRESHOLD_MG_M2;
		return isBelow
			? { level: "critical", label: t("coverage.critical") }
			: { level: "optimal", label: t("coverage.optimalBadge") };
	}
	if (coverage.fullDoseGPerHa != null) {
		const rawPercent =
			(coverage.weightedRemainingGPerHa / coverage.fullDoseGPerHa) * 100;
		const level = doseStatusLevel(rawPercent);
		const label =
			level === "critical"
				? t("coverage.critical")
				: level === "warning"
					? t("coverage.warning")
					: t("coverage.optimalBadge");
		return { level, label };
	}
	return null;
}

export function StatusBadge({
	level,
	label,
}: {
	level: StatusLevel;
	label: string;
}) {
	const Icon = level === "optimal" ? CheckCircle2 : AlertTriangle;
	return (
		<span
			className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs sm:text-sm font-medium ${STATUS_BADGE_STYLES[level]}`}
		>
			<Icon className="h-3.5 w-3.5" />
			{label}
		</span>
	);
}

interface GaugeConfig {
	value: number;
	max: number;
	ticks: number[];
	optimalTick: number;
	gradient: { pos: number; color: string }[];
	formatTick: (tick: number) => string;
}

function Gauge({
	value,
	max,
	ticks,
	optimalTick,
	gradient,
	formatTick,
}: GaugeConfig) {
	const { t } = useTranslations();
	const pct = Math.min(100, Math.max(0, (value / max) * 100));
	const isOverflow = value > max;
	const gradientCss = gradient
		.map(({ pos, color }) => `${color} ${(pos / max) * 100}%`)
		.join(", ");

	return (
		<div className="space-y-1">
			<div className="relative h-6 flex items-center">
				<div
					className="h-3 w-full rounded-full"
					style={{ background: `linear-gradient(to right, ${gradientCss})` }}
				/>
				<div
					className={`absolute top-1/2 h-5 w-2 -translate-y-1/2 rounded-full border-2 bg-white ${
						isOverflow ? "border-red-600" : "border-gray-700"
					}`}
					style={{ left: `calc(${pct}% - 4px)` }}
				/>
				{isOverflow && (
					<span className="absolute -top-4 right-0 text-[10px] font-semibold text-red-600">
						{formatTick(Math.round(value))}
					</span>
				)}
			</div>
			<div className="relative h-4 text-[10px] sm:text-xs text-muted-foreground">
				{ticks.map((tick) => {
					const tickPct = (tick / max) * 100;
					const isOptimal = tick === optimalTick;
					const translate =
						tickPct === 0 ? "0%" : tickPct === 100 ? "-100%" : "-50%";
					return (
						<span
							key={tick}
							className={`absolute whitespace-nowrap ${isOptimal ? "font-semibold text-green-600" : ""}`}
							style={{
								left: `${tickPct}%`,
								transform: `translateX(${translate})`,
							}}
						>
							{isOptimal
								? `${formatTick(tick)} ${t("coverage.optimalSuffix")}`
								: formatTick(tick)}
						</span>
					);
				})}
			</div>
		</div>
	);
}

interface ForecastMetric {
	// Converts the projected g/ha figure into whatever unit the gauge above uses.
	convert: (projectedGPerHa: number) => number;
	unit: string;
	statusLevel: (value: number) => StatusLevel;
	subtitle: string;
}

function ForecastRow({
	forecast,
	metric,
}: {
	forecast: CoverageForecastDay[];
	metric: ForecastMetric | null;
}) {
	const { t } = useTranslations();
	if (forecast.length === 0) return null;

	return (
		<div className="space-y-2">
			<div>
				<p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
					{t("coverage.forecast")}
				</p>
				{metric && (
					<p className="text-xs text-muted-foreground">{metric.subtitle}</p>
				)}
			</div>
			<div className="grid grid-cols-3 gap-2">
				{forecast.map((day, i) => {
					const date = new Date(day.date);
					const dayName = date
						.toLocaleDateString(undefined, { weekday: "short" })
						.toUpperCase();
					const value = metric
						? metric.convert(day.projectedWeightedRemainingGPerHa)
						: null;
					const level = value !== null ? metric!.statusLevel(value) : null;

					return (
						<div
							key={i}
							className={`rounded-lg p-2 text-center space-y-0.5 ${
								level && level !== "optimal" ? "bg-red-50" : "bg-muted"
							}`}
						>
							<p className="text-xs text-muted-foreground">
								{dayName} {date.getDate()}
							</p>
							{value !== null && level ? (
								<>
									<p className={`font-semibold ${STATUS_TEXT_COLOR[level]}`}>
										{value.toFixed(2)}
									</p>
									<p className="text-xs text-muted-foreground">
										{metric!.unit}
									</p>
								</>
							) : (
								<p className="font-semibold">
									{Math.round(day.projectedWeightedRemainingGPerHa)} g/ha
								</p>
							)}
							{day.precipitationMm > 0 && (
								<p className="flex items-center justify-center gap-1 text-xs text-blue-500">
									<CloudRain className="h-3 w-3" />
									{day.precipitationMm.toFixed(1)}
									{t("coverage.mm")}
								</p>
							)}
							{level && level !== "optimal" && (
								<p
									className={`flex items-center justify-center gap-1 text-xs ${STATUS_TEXT_COLOR[level]}`}
								>
									<AlertTriangle className="h-3 w-3" />
									{level === "critical"
										? t("coverage.critical")
										: t("coverage.warning")}
								</p>
							)}
						</div>
					);
				})}
			</div>
		</div>
	);
}

interface ResidualPanelProps {
	titleSuffix: string;
	explanation: string;
	gauge: GaugeConfig;
	valueLabel: ReactNode;
	status: { level: StatusLevel; label: string };
	forecast: CoverageForecastDay[];
	forecastMetric: ForecastMetric | null;
}

// Shared layout for both the copper (leaf mg/m²) and dose-percent (e.g. sulfur) residual
// readouts: title + explanation, gauge, big value + status badge, then the 3-day forecast.
// Only the gauge scale, the displayed value, and the forecast conversion differ per substance.
export function ResidualPanel({
	titleSuffix,
	explanation,
	gauge,
	valueLabel,
	status,
	forecast,
	forecastMetric,
}: ResidualPanelProps) {
	const { t } = useTranslations();

	return (
		<div className="border-t pt-4 space-y-3">
			<div>
				<p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
					{t("coverage.title")}
					{titleSuffix}
				</p>
				<p className="text-xs text-muted-foreground">{explanation}</p>
			</div>

			<Gauge {...gauge} />

			<div className="flex items-baseline justify-between gap-2 flex-wrap">
				<p>{valueLabel}</p>
				<StatusBadge level={status.level} label={status.label} />
			</div>

			<ForecastRow forecast={forecast} metric={forecastMetric} />
		</div>
	);
}

// Computes the branch-specific ResidualPanel props for a substance's coverage: the
// leaf-surface (copper) gauge, the dose-percent (e.g. sulfur) gauge, or null when the
// substance has neither anchor to report against.
export function getResidualPanelProps(
	coverage: SubstanceCoverage,
	hasWeatherData: boolean,
	t: (key: string) => string,
): ResidualPanelProps | null {
	const leafSurfaceMgPerM2 = coverage.leafSurfaceMgPerM2;
	const status = getCoverageStatus(coverage, t);

	if (leafSurfaceMgPerM2 !== undefined && status) {
		const leafSurfaceRatio =
			coverage.weightedRemainingGPerHa > 0
				? leafSurfaceMgPerM2 / coverage.weightedRemainingGPerHa
				: null;

		return {
			titleSuffix: ` · ${
				hasWeatherData
					? t("coverage.residualOnLeaves")
					: t("coverage.timeDecayOnly")
			}`,
			explanation: t("coverage.leafExplanation"),
			gauge: {
				value: leafSurfaceMgPerM2,
				max: LEAF_GAUGE_MAX_MG_M2,
				ticks: LEAF_GAUGE_TICKS,
				optimalTick: LEAF_GAUGE_OPTIMAL_MG_M2,
				gradient: LEAF_GAUGE_GRADIENT,
				formatTick: (tick) => String(tick),
			},
			valueLabel: (
				<span
					className={`text-xl sm:text-2xl font-bold ${STATUS_TEXT_COLOR[status.level]}`}
				>
					{leafSurfaceMgPerM2.toFixed(2)} mg/m²
				</span>
			),
			status: {
				level: status.level,
				label:
					status.level === "critical"
						? t("coverage.belowThreshold")
						: t("coverage.aboveThreshold"),
			},
			forecast: coverage.forecast,
			forecastMetric:
				leafSurfaceRatio !== null
					? {
							convert: (g) => g * leafSurfaceRatio,
							unit: "mg/m²",
							statusLevel: (v) =>
								v < COPPER_EFFICACY_THRESHOLD_MG_M2 ? "critical" : "optimal",
							subtitle: t("coverage.forecastSubtitleLeaf"),
						}
					: null,
		};
	}

	// No leaf-surface metric for this substance (e.g. sulfur): fall back to a dose-residual
	// gauge, 100% = the substance's full-protection anchor dose (fullDoseGPerHa). Computed
	// unclamped here (unlike coverage.coveragePercent, which calculateCoverageData caps at
	// 100) so over-application can actually render in the gauge's excess/red zone.
	if (coverage.fullDoseGPerHa != null && status) {
		const fullDoseGPerHa = coverage.fullDoseGPerHa;
		const rawPercent =
			(coverage.weightedRemainingGPerHa / fullDoseGPerHa) * 100;

		return {
			titleSuffix: !hasWeatherData ? ` · ${t("coverage.timeDecayOnly")}` : "",
			explanation: t("coverage.percentExplanation"),
			gauge: {
				value: rawPercent,
				max: DOSE_GAUGE_MAX_PERCENT,
				ticks: DOSE_GAUGE_TICKS,
				optimalTick: DOSE_GAUGE_OPTIMAL_PERCENT,
				gradient: DOSE_GAUGE_GRADIENT,
				formatTick: (tick) => `${tick}%`,
			},
			valueLabel: (
				<>
					<span
						className={`text-xl sm:text-2xl font-bold ${STATUS_TEXT_COLOR[status.level]}`}
					>
						{Math.round(rawPercent)}% {t("coverage.remainingPercent")}
					</span>{" "}
					<span className="text-sm sm:text-base text-muted-foreground">
						{Math.round(coverage.weightedRemainingGPerHa)} g/ha{" "}
						{t("coverage.of")} {Math.round(fullDoseGPerHa)} g/ha
					</span>
				</>
			),
			status,
			forecast: coverage.forecast,
			forecastMetric: {
				convert: (g) => (g / fullDoseGPerHa) * 100,
				unit: "%",
				statusLevel: doseStatusLevel,
				subtitle: t("coverage.forecastSubtitleDose"),
			},
		};
	}

	return null;
}
