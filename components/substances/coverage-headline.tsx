"use client";

import { type SubstanceCoverage } from "../types";
import { useTranslations } from "@/contexts/translations-context";
import {
	COPPER_EFFICACY_THRESHOLD_MG_M2,
	COPPER_LEAF_AREA_FACTOR,
	FULL_DOSE_G_PER_HA,
} from "@/lib/coverage-helpers";
import { AlertTriangle, Info, ShieldCheck } from "lucide-react";
import {
	STATUS_BADGE_STYLES,
	type StatusLevel,
} from "./coverage-residual-panel";

// Substances with a full-protection anchor get a coverage readout; others never do.
export function isCoverageTracked(substanceName: string): boolean {
	return Object.hasOwn(FULL_DOSE_G_PER_HA, substanceName);
}

// Below this share of the full-protection dose, the dose gauge leaves its optimal band.
const DOSE_RETREAT_BELOW_PERCENT = 50;
// During a critical period (a targeted disease is High/Very high at the parcels' stage),
// "Re-treat soon" fires once the 3-day projection drops below 75 % of the full dose.
const CRITICAL_PERIOD_SHARE_OF_FULL_DOSE = 0.75;
const CRITICAL_PERIOD_RETREAT_SOON_PERCENT =
	CRITICAL_PERIOD_SHARE_OF_FULL_DOSE * 100;
// Copper's threshold already is its full dose (2.5 mg/m² = 100 g/ha), so 75 % of it would
// be below the threshold: keep the same 25 % margin above the threshold instead.
const CRITICAL_PERIOD_COPPER_RETREAT_SOON_MG_M2 =
	COPPER_EFFICACY_THRESHOLD_MG_M2 / CRITICAL_PERIOD_SHARE_OF_FULL_DOSE;

export type RetreatAdvice =
	| "retreatNow"
	| "retreatSoon"
	| "protected"
	| "aboveFullDose";

const ADVICE_LEVEL: Record<RetreatAdvice, StatusLevel> = {
	retreatNow: "critical",
	retreatSoon: "warning",
	protected: "optimal",
	aboveFullDose: "critical",
};

const ADVICE_KEYS: Record<RetreatAdvice, string> = {
	retreatNow: "coverage.adviceRetreatNow",
	retreatSoon: "coverage.adviceRetreatSoon",
	protected: "coverage.adviceProtected",
	aboveFullDose: "coverage.adviceAboveFullDose",
};

// "Re-treat soon" when protection is fine today but the 3-day forecast (rain + time
// decay) drops it below soonBelow: the threshold, or a higher bar in a critical period.
// belowThreshold matches the body's status badge: copper under its efficacy threshold
// is critical, a low sulfur dose only a warning.
function getRetreatAdvice(
	current: number,
	projected: number[],
	threshold: number,
	soonBelow: number,
	fullDose: number | null,
	belowThreshold: RetreatAdvice,
): RetreatAdvice {
	if (current < threshold) return belowThreshold;
	if ([current, ...projected].some((value) => value < soonBelow)) {
		return "retreatSoon";
	}
	if (fullDose !== null && current > fullDose) return "aboveFullDose";
	return "protected";
}

// Short headline for the card header: the one number a farmer checks first, plus
// what to do about it. isCriticalPeriod advises re-treating earlier.
export function getCoverageHeadline(
	coverage: SubstanceCoverage,
	isCriticalPeriod = false,
): { value: string; advice: RetreatAdvice } | null {
	const projectedGPerHa = coverage.forecast.map(
		(day) => day.projectedWeightedRemainingGPerHa,
	);
	if (coverage.leafSurfaceMgPerM2 !== undefined) {
		return {
			value: `${coverage.leafSurfaceMgPerM2.toFixed(2)} mg/m²`,
			advice: getRetreatAdvice(
				coverage.leafSurfaceMgPerM2,
				projectedGPerHa.map((g) => g / COPPER_LEAF_AREA_FACTOR),
				COPPER_EFFICACY_THRESHOLD_MG_M2,
				isCriticalPeriod
					? CRITICAL_PERIOD_COPPER_RETREAT_SOON_MG_M2
					: COPPER_EFFICACY_THRESHOLD_MG_M2,
				null,
				"retreatNow",
			),
		};
	}
	if (coverage.fullDoseGPerHa != null) {
		const fullDoseGPerHa = coverage.fullDoseGPerHa;
		const rawPercent =
			(coverage.weightedRemainingGPerHa / fullDoseGPerHa) * 100;
		return {
			value: `${Math.round(rawPercent)}%`,
			advice: getRetreatAdvice(
				rawPercent,
				projectedGPerHa.map((g) => (g / fullDoseGPerHa) * 100),
				DOSE_RETREAT_BELOW_PERCENT,
				isCriticalPeriod
					? CRITICAL_PERIOD_RETREAT_SOON_PERCENT
					: DOSE_RETREAT_BELOW_PERCENT,
				100,
				"retreatSoon",
			),
		};
	}
	return null;
}

export function ProtectionPill({
	value,
	advice,
}: {
	value: string;
	advice: RetreatAdvice;
}) {
	const { t } = useTranslations();
	const level = ADVICE_LEVEL[advice];
	const Icon = level === "optimal" ? ShieldCheck : AlertTriangle;
	return (
		<span
			className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-sm ${STATUS_BADGE_STYLES[level]}`}
		>
			<Icon className="h-4 w-4 shrink-0" aria-hidden />
			<span>{t("coverage.headlineLabel")}</span>
			<span className="font-bold">{value}</span>
			<span aria-hidden>·</span>
			<span className="font-medium">{t(ADVICE_KEYS[advice])}</span>
		</span>
	);
}

export type CoverageNoteReason =
	| "noActiveDisease"
	| "noCompletedTreatments"
	| "notTracked"
	| "unavailable";

const NOTE_KEYS: Record<CoverageNoteReason, string> = {
	noActiveDisease: "coverage.hiddenNoActiveDisease",
	noCompletedTreatments: "coverage.hiddenNoCompletedTreatments",
	notTracked: "coverage.hiddenNotTracked",
	unavailable: "coverage.hiddenUnavailable",
};

// Explains why there is no protection readout, instead of silently omitting it.
export function CoverageHiddenNote({ reason }: { reason: CoverageNoteReason }) {
	const { t } = useTranslations();
	return (
		<p className="flex items-start gap-2 rounded-md border border-dashed px-3 py-2 text-xs text-muted-foreground">
			<Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
			{t(NOTE_KEYS[reason])}
		</p>
	);
}
