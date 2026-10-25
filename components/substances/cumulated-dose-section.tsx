"use client";

import { type SubstanceData } from "../types";
import { useTranslations } from "@/contexts/translations-context";
import { GRAMS_PER_KILOGRAM } from "@/lib/constants";
import { getSubstanceInk } from "@/lib/substance-colors";
import { formatNumber } from "@/lib/utils";
import { CalendarRange } from "lucide-react";
import { CardSectionHeader } from "./card-section-header";

// Small doses still read as more than zero: 0.45, 0.012 kg/ha.
function formatKgPerHa(kgPerHa: number, locale: string) {
	return formatNumber(kgPerHa, locale, kgPerHa < 1 ? 3 : 2);
}

const STAT_TILE = "rounded-lg bg-muted px-3.5 py-3";
const STAT_LABEL = "text-xs leading-4 text-neutral-600";
const STAT_VALUE =
	"m-0 mt-0.5 text-[22px] leading-7 font-bold tabular-nums text-foreground";

export function CumulatedDoseSection({
	substance,
	substanceColor,
	showTitle = false,
}: {
	substance: SubstanceData;
	substanceColor: string;
	// Only needed when the card also shows "protection now" above it; the section
	// header already explains what "used this year" counts.
	showTitle?: boolean;
}) {
	const { t, locale, getSubstanceTranslation } = useTranslations();
	const substanceInKgPerHa =
		substance.totalUsedOfPureActiveSubstancePerHaGrams / GRAMS_PER_KILOGRAM;
	const dosePct =
		substance.maxDosage > 0
			? Math.min(
					100,
					Math.round((substanceInKgPerHa / substance.maxDosage) * 100),
				)
			: 0;
	const unit = t("substances.units.KG_PER_HA");

	return (
		<div className={showTitle ? "space-y-3.5 border-t pt-4" : "space-y-3.5"}>
			{showTitle && (
				<CardSectionHeader
					icon={CalendarRange}
					title={t("coverage.cumulatedDose")}
				/>
			)}
			<dl className="m-0 grid grid-cols-2 gap-3">
				<div className={STAT_TILE}>
					<dt className={STAT_LABEL}>{t("coverage.productApplied")}</dt>
					<dd className={STAT_VALUE}>
						{formatNumber(substance.totalDoseOfProduct, locale, 2)} g
					</dd>
				</div>
				<div className={STAT_TILE}>
					<dt className={STAT_LABEL}>{t("coverage.activeSubstance")}</dt>
					<dd className={STAT_VALUE}>
						{formatKgPerHa(substanceInKgPerHa, locale)} {unit}
					</dd>
				</div>
			</dl>
			<div className="space-y-1.5">
				<div
					role="meter"
					aria-label={`${getSubstanceTranslation(substance.name)}: ${t("coverage.cumulatedDose")}`}
					aria-valuemin={0}
					aria-valuemax={substance.maxDosage}
					aria-valuenow={Number(substanceInKgPerHa.toFixed(3))}
					aria-valuetext={`${dosePct}% ${t("coverage.yearlyLimitUsed")}`}
					className="h-2.5 w-full overflow-hidden rounded-full bg-neutral-200"
				>
					<div
						className="h-full rounded-full transition-all"
						style={{
							// A sliver even at 0%, so the bar reads as a meter.
							width: `${Math.max(dosePct, 1.5)}%`,
							backgroundColor: substanceColor,
						}}
					/>
				</div>
				<div className="flex items-baseline justify-between gap-2 text-xs leading-4 text-muted-foreground">
					<span>0</span>
					<span
						className="font-semibold"
						style={{ color: getSubstanceInk(substance.name) }}
					>
						{dosePct}% {t("coverage.yearlyLimitUsed")}
					</span>
					<span>
						{formatNumber(substance.maxDosage, locale, 2)} {unit}{" "}
						{t("coverage.maxSuffix")}
					</span>
				</div>
			</div>
		</div>
	);
}
