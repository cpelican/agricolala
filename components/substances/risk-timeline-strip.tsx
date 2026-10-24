"use client";

import {
	DiseaseSensitivityLevel,
	type PhenologicalStage,
} from "@prisma/client";
import { StageIcon } from "@/components/phenology/stage-icon";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { useTranslations } from "@/contexts/translations-context";
import { type SubstanceRiskTimeline } from "@/lib/disease-stage-sensitivity";
import { PHENOLOGICAL_STAGES } from "@/lib/phenology";
import { cn } from "@/lib/utils";
import { ExperimentalLabel } from "./stage-risk-chips";

const LEVEL_COLORS: Record<DiseaseSensitivityLevel, string> = {
	[DiseaseSensitivityLevel.NONE]: "bg-slate-200",
	[DiseaseSensitivityLevel.LOW]: "bg-green-300",
	[DiseaseSensitivityLevel.MEDIUM]: "bg-yellow-300",
	[DiseaseSensitivityLevel.HIGH]: "bg-orange-400",
	[DiseaseSensitivityLevel.VERY_HIGH]: "bg-red-500",
};
// Stage with no matrix row for the substance's diseases.
const UNKNOWN_LEVEL_COLOR = "bg-muted";
// Dots drawn under a stage before switching to a count.
const MAX_DOTS = 3;

function TreatmentDots({ count }: { count: number }) {
	if (count > MAX_DOTS) {
		return (
			<span className="text-[10px] font-semibold leading-none">{count}</span>
		);
	}
	return (
		<>
			{Array.from({ length: count }, (_, index) => (
				<span
					key={index}
					className="h-1.5 w-1.5 rounded-full bg-foreground/70"
				/>
			))}
		</>
	);
}

// Thin band of the 8 stages coloured by the substance's highest disease level, with
// the current stage's pictogram above it and one dot per treatment day below. Tapping
// it lists each stage's level in words (a popover, so it also works on phones).
export function RiskTimelineStrip({
	timeline,
	currentStage,
	showExperimentalLabel,
}: {
	timeline: SubstanceRiskTimeline;
	currentStage: PhenologicalStage | null;
	// Off when the "Critical period" chip above already shows the label.
	showExperimentalLabel: boolean;
}) {
	const { t } = useTranslations();
	const title = t("phenology.riskTimeline");
	const levelLabel = (level: DiseaseSensitivityLevel | null) =>
		level ? t(`phenology.levels.${level}`) : t("phenology.levelUnknown");

	return (
		<div className="space-y-1" data-testid="substance-risk-timeline">
			<div className="flex flex-wrap items-center gap-2">
				<span className="text-xs font-medium text-muted-foreground">
					{title}
				</span>
				{showExperimentalLabel && <ExperimentalLabel />}
			</div>
			<Popover>
				<PopoverTrigger asChild>
					<button
						type="button"
						className="block w-full space-y-0.5 rounded-sm text-left"
						aria-label={title}
					>
						<ol className="grid grid-cols-8 gap-0.5">
							{timeline.map(({ stage, level, treatmentDays }) => (
								<li
									key={stage}
									className="flex flex-col items-center gap-0.5"
									data-stage={stage}
									data-current={stage === currentStage || undefined}
								>
									<span className="flex h-5 items-end">
										{stage === currentStage && (
											<StageIcon stage={stage} className="h-5 w-5" />
										)}
									</span>
									<span
										className={cn(
											"h-2 w-full",
											level ? LEVEL_COLORS[level] : UNKNOWN_LEVEL_COLOR,
											stage === currentStage &&
												"ring-2 ring-foreground ring-offset-1",
										)}
									/>
									<span className="flex h-2 items-center gap-0.5">
										<TreatmentDots count={treatmentDays} />
									</span>
								</li>
							))}
						</ol>
						<span className="flex justify-between text-[10px] text-muted-foreground">
							<span>
								{t(`phenology.stages.${PHENOLOGICAL_STAGES[0]}.label`)}
							</span>
							<span>
								{t(`phenology.stages.${PHENOLOGICAL_STAGES[7]}.label`)}
							</span>
						</span>
					</button>
				</PopoverTrigger>
				<PopoverContent className="w-72 space-y-2 p-3 text-xs">
					<p className="text-sm font-semibold">{title}</p>
					<ul className="space-y-1">
						{timeline.map(({ stage, level, treatmentDays }) => (
							<li
								key={stage}
								className={cn(
									"flex items-center gap-2",
									stage === currentStage && "font-semibold",
								)}
							>
								<span
									className={cn(
										"h-2.5 w-2.5 shrink-0 rounded-sm",
										level ? LEVEL_COLORS[level] : UNKNOWN_LEVEL_COLOR,
									)}
									aria-hidden
								/>
								<span className="flex-1">
									{t(`phenology.stages.${stage}.label`)}
									{stage === currentStage && ` · ${t("phenology.now")}`}
								</span>
								<span>{levelLabel(level)}</span>
								{treatmentDays > 0 && (
									<span className="text-muted-foreground">
										{t("phenology.treatmentDays").replace(
											"{count}",
											String(treatmentDays),
										)}
									</span>
								)}
							</li>
						))}
					</ul>
					<p className="text-muted-foreground">
						{t("phenology.riskTimelineDots")}
					</p>
					<p className="text-muted-foreground">
						{t("phenology.criticalPeriodTooltip")}
					</p>
				</PopoverContent>
			</Popover>
		</div>
	);
}
