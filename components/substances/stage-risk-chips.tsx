"use client";

import { AlertTriangle, FlaskConical } from "lucide-react";
import { StageIcon } from "@/components/phenology/stage-icon";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { useTranslations } from "@/contexts/translations-context";
import { type SubstanceStageRisk } from "@/lib/disease-stage-sensitivity";

// Substance card header line: the parcels' stage and, when a targeted disease is
// High/Very high at it, a "Critical period" chip with the experimental label. The
// label opens on tap (a popover, not a hover tooltip) so it also works on phones.
export function StageRiskChips({ risk }: { risk: SubstanceStageRisk }) {
	const { t } = useTranslations();
	return (
		<div
			className="flex flex-wrap items-center gap-2"
			data-testid="substance-stage-risk"
		>
			<span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
				<StageIcon stage={risk.stage} className="h-5 w-5" />
				{t(`phenology.stages.${risk.stage}.label`)}
			</span>
			{risk.isCritical && (
				<>
					<span className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-600">
						<AlertTriangle className="h-3.5 w-3.5" aria-hidden />
						{t("phenology.criticalPeriod")}
					</span>
					<Popover>
						<PopoverTrigger asChild>
							<button
								type="button"
								className="inline-flex items-center gap-1 rounded-full border border-purple-200 bg-purple-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-purple-700"
							>
								<FlaskConical className="h-3 w-3" aria-hidden />
								{t("coverage.experimental")}
							</button>
						</PopoverTrigger>
						<PopoverContent className="w-64 p-3 text-xs">
							{t("phenology.criticalPeriodTooltip")}
						</PopoverContent>
					</Popover>
				</>
			)}
		</div>
	);
}
