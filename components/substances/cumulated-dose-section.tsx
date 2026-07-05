"use client";

import { type SubstanceData } from "../types";
import { useTranslations } from "@/contexts/translations-context";
import { GRAMS_PER_KILOGRAM } from "@/lib/constants";

function formatTrimmed(value: number, decimals = 2): string {
	return String(Number(value.toFixed(decimals)));
}

export function CumulatedDoseSection({
	substance,
	substanceColor,
}: {
	substance: SubstanceData;
	substanceColor: string;
}) {
	const { t } = useTranslations();
	const substanceInKgPerHa =
		substance.totalUsedOfPureActiveSubstancePerHaGrams / GRAMS_PER_KILOGRAM;
	const dosePct =
		substance.maxDosage > 0
			? Math.min(
					100,
					Math.round((substanceInKgPerHa / substance.maxDosage) * 100),
				)
			: 0;

	return (
		<div className="border-t pt-4 space-y-3">
			<p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
				{t("coverage.cumulatedDose")}
			</p>
			<div className="grid grid-cols-2 gap-3">
				<div className="rounded-lg bg-muted p-3">
					<p className="text-xs text-muted-foreground">
						{t("coverage.productApplied")}
					</p>
					<p className="text-lg font-bold">
						{substance.totalDoseOfProduct.toFixed(2)} gr
					</p>
				</div>
				<div className="rounded-lg bg-muted p-3">
					<p className="text-xs text-muted-foreground">
						{t("coverage.activeSubstance")}
					</p>
					<p className="text-lg font-bold">
						{formatTrimmed(substance.totalUsedOfPureActiveSubstancePerHaGrams)}{" "}
						g/ha
					</p>
				</div>
			</div>
			<div className="space-y-1.5">
				<div className="h-2 w-full rounded-full bg-muted overflow-hidden">
					<div
						className="h-full rounded-full transition-all"
						style={{
							width: `${dosePct}%`,
							backgroundColor: substanceColor,
						}}
					/>
				</div>
				<div className="flex justify-between items-baseline text-xs text-muted-foreground">
					<span>0</span>
					<span className="font-semibold" style={{ color: substanceColor }}>
						{dosePct}% {t("coverage.of")} {substance.maxDosage} kg/ha{" "}
						{t("coverage.maxSuffix")}
					</span>
					<span>{substance.maxDosage} kg/ha</span>
				</div>
			</div>
		</div>
	);
}
