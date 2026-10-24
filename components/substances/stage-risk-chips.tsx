"use client";

import { AlertTriangle, FlaskConical } from "lucide-react";
import { StageIcon } from "@/components/phenology/stage-icon";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { useDiseases } from "@/contexts/cached-data-context";
import { useTranslations } from "@/contexts/translations-context";
import { type SubstanceStageRisk } from "@/lib/disease-stage-sensitivity";

function ExperimentalLabel() {
	const { t } = useTranslations();
	return (
		<span className="inline-flex items-center gap-1 rounded-full border border-purple-200 bg-purple-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-purple-700">
			<FlaskConical className="h-3 w-3" aria-hidden />
			{t("coverage.experimental")}
		</span>
	);
}

// Substance card header line: the parcels' stage and, when a targeted disease is
// High/Very high at it, a "Critical period" chip naming those diseases, with the
// experimental label. Tapping the chip explains it (a popover, not a hover tooltip,
// so it also works on phones).
export function StageRiskChips({ risk }: { risk: SubstanceStageRisk }) {
	const { t, locale } = useTranslations();
	const diseases = useDiseases();
	const stageLabel = t(`phenology.stages.${risk.stage}.label`);
	const diseaseNames = new Intl.ListFormat(locale, {
		type: "conjunction",
	}).format(
		risk.criticalDiseaseIds.flatMap((id) => {
			const name = diseases.find((disease) => disease.id === id)?.name;
			if (!name) return [];
			const key = `diseases.${name.toLowerCase()}`;
			const label = t(key);
			return [label === key ? name : label];
		}),
	);

	return (
		<div
			className="flex flex-wrap items-center gap-2"
			data-testid="substance-stage-risk"
		>
			<span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
				<StageIcon stage={risk.stage} className="h-5 w-5" />
				{stageLabel}
			</span>
			{risk.isCritical && (
				<>
					<Popover>
						<PopoverTrigger asChild>
							<button
								type="button"
								className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-600"
							>
								<AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden />
								{t("phenology.criticalPeriod")}
								{diseaseNames && (
									<span className="font-medium">· {diseaseNames}</span>
								)}
							</button>
						</PopoverTrigger>
						<PopoverContent className="w-72 space-y-2 p-3 text-xs">
							<p>
								{t("phenology.criticalPeriodExplanation")
									.replace("{stage}", stageLabel)
									.replace("{diseases}", diseaseNames)}
							</p>
							<p className="text-muted-foreground">
								{t("phenology.criticalPeriodTooltip")}
							</p>
						</PopoverContent>
					</Popover>
					<ExperimentalLabel />
				</>
			)}
		</div>
	);
}
