"use client";

import { AlertTriangle, FlaskConical } from "lucide-react";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { useDiseases } from "@/contexts/cached-data-context";
import { useTranslations } from "@/contexts/translations-context";
import { type SubstanceStageRisk } from "@/lib/disease-stage-sensitivity";

export function ExperimentalLabel() {
	const { t } = useTranslations();
	return (
		<span className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2 py-0.5 text-[11px] leading-4 font-medium text-neutral-600">
			<FlaskConical className="size-3" aria-hidden />
			{t("coverage.experimental")}
		</span>
	);
}

// Translated disease name, or the catalogue name when it has no translation.
export function useDiseaseLabel() {
	const { t } = useTranslations();
	const diseases = useDiseases();
	return (diseaseId: string) => {
		const name = diseases.find((disease) => disease.id === diseaseId)?.name;
		if (!name) return null;
		const key = `diseases.${name.toLowerCase()}`;
		const label = t(key);
		return label === key ? name : label;
	};
}

// Substance card header line: the diseases the substance targets, so the grower
// knows what it fights. The ones at a critical period at the parcels' stage share a
// red chip with the experimental label; tapping it explains why (a popover, not a
// hover tooltip, so it also works on phones). Stage-by-stage risk is in the
// dashboard's disease risk section.
export function DiseaseBadges({
	diseaseIds,
	risk,
}: {
	diseaseIds: string[];
	risk?: SubstanceStageRisk;
}) {
	const { t, locale } = useTranslations();
	const diseaseLabel = useDiseaseLabel();
	const listFormat = new Intl.ListFormat(locale, { type: "conjunction" });
	const criticalIds = risk?.criticalDiseaseIds ?? [];
	const otherLabels = diseaseIds
		.filter((id) => !criticalIds.includes(id))
		.flatMap((id) => diseaseLabel(id) ?? []);
	const criticalNames = listFormat.format(
		criticalIds.flatMap((id) => diseaseLabel(id) ?? []),
	);

	if (otherLabels.length === 0 && criticalIds.length === 0) return null;

	return (
		<div
			className="flex flex-wrap items-center gap-2"
			data-testid="substance-diseases"
		>
			{risk && criticalIds.length > 0 && (
				<Popover>
					<PopoverTrigger asChild>
						<button
							type="button"
							className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-600"
							aria-label={`${t("phenology.criticalPeriod")}: ${criticalNames}`}
						>
							<AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden />
							{criticalNames}
						</button>
					</PopoverTrigger>
					<PopoverContent className="w-72 space-y-2 p-3 text-xs">
						<p className="flex items-center gap-1.5 text-sm font-semibold text-red-600">
							<AlertTriangle className="h-4 w-4 shrink-0" aria-hidden />
							{t("phenology.criticalPeriod")}
						</p>
						<p>
							{t("phenology.criticalPeriodExplanation")
								.replace("{stage}", t(`phenology.stages.${risk.stage}.label`))
								.replace("{diseases}", criticalNames)}
						</p>
						<p className="text-muted-foreground">
							{t("phenology.criticalPeriodTooltip")}
						</p>
					</PopoverContent>
				</Popover>
			)}
			{otherLabels.map((label) => (
				<span
					key={label}
					className="inline-flex items-center rounded-full border bg-muted/50 px-2.5 py-0.5 text-xs font-medium text-muted-foreground"
				>
					{label}
				</span>
			))}
			{criticalIds.length > 0 && <ExperimentalLabel />}
		</div>
	);
}
