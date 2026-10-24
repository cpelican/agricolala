"use client";

import {
	DiseaseSensitivityLevel,
	type PhenologicalStage,
} from "@prisma/client";
import { StageIcon } from "@/components/phenology/stage-icon";
import {
	ExperimentalLabel,
	useDiseaseLabel,
} from "@/components/substances/disease-badges";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { useTranslations } from "@/contexts/translations-context";
import { type DiseaseRiskTimeline } from "@/lib/disease-stage-sensitivity";
import { PHENOLOGICAL_STAGES } from "@/lib/phenology";
import { cn } from "@/lib/utils";

const LEVEL_COLORS: Record<DiseaseSensitivityLevel, string> = {
	[DiseaseSensitivityLevel.NONE]: "bg-slate-200",
	[DiseaseSensitivityLevel.LOW]: "bg-green-300",
	[DiseaseSensitivityLevel.MEDIUM]: "bg-yellow-300",
	[DiseaseSensitivityLevel.HIGH]: "bg-orange-400",
	[DiseaseSensitivityLevel.VERY_HIGH]: "bg-red-500",
};
// Stage with no matrix row for the disease.
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

// One disease: its name, a thin band of the 8 stages coloured by its level with the
// current stage ringed and the others faded, and one dot per day treated against it below. Tapping it
// lists each stage's level in words (a popover, so it also works on phones).
function DiseaseRiskRow({
	diseaseId,
	timeline,
	currentStage,
	isCritical,
}: {
	diseaseId: string;
	timeline: DiseaseRiskTimeline;
	currentStage: PhenologicalStage | null;
	isCritical: boolean;
}) {
	const { t } = useTranslations();
	const name = useDiseaseLabel()(diseaseId) ?? diseaseId;
	const levelLabel = (level: DiseaseSensitivityLevel | null) =>
		level ? t(`phenology.levels.${level}`) : t("phenology.levelUnknown");

	return (
		<li data-testid="disease-risk-row">
			<Popover>
				<PopoverTrigger asChild>
					<button
						type="button"
						className="block w-full space-y-1 rounded-sm text-left"
						aria-label={t("phenology.riskByStage").replace("{disease}", name)}
					>
						<span className="block text-sm font-medium">{name}</span>
						<ol className="grid grid-cols-8 gap-0.5">
							{timeline.map(({ stage, level, treatmentDays }) => (
								<li
									key={stage}
									className="flex flex-col items-center gap-0.5"
									data-stage={stage}
									data-current={stage === currentStage || undefined}
								>
									<span
										className={cn(
											"h-2 w-full",
											level ? LEVEL_COLORS[level] : UNKNOWN_LEVEL_COLOR,
											stage === currentStage
												? "ring-2 ring-foreground ring-offset-1"
												: currentStage && "opacity-40",
										)}
									/>
									<span className="flex h-2 items-center gap-0.5">
										<TreatmentDots count={treatmentDays} />
									</span>
								</li>
							))}
						</ol>
					</button>
				</PopoverTrigger>
				<PopoverContent className="w-72 space-y-2 p-3 text-xs">
					<p className="text-sm font-semibold">{name}</p>
					{isCritical && currentStage && (
						<p>
							{t("phenology.criticalPeriodExplanation")
								.replace("{stage}", t(`phenology.stages.${currentStage}.label`))
								.replace("{diseases}", name)}
						</p>
					)}
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
						{t("phenology.riskTimelineTooltip")}
					</p>
				</PopoverContent>
			</Popover>
		</li>
	);
}

// Top of the dashboard: the vines' stage (the riskiest among the parcels' current
// stages) and, per disease, its risk across the season with the days treated
// against it. The substance cards only name the diseases they target.
export function DiseaseRiskSection({
	stage,
	criticalDiseaseIds,
	rows,
}: {
	stage: PhenologicalStage | null;
	criticalDiseaseIds: string[];
	rows: { diseaseId: string; timeline: DiseaseRiskTimeline }[];
}) {
	const { t } = useTranslations();

	return (
		<Card data-testid="disease-risk-section">
			<CardHeader className="space-y-2 pb-3">
				<div className="flex flex-wrap items-center gap-2">
					<CardTitle>{t("phenology.diseaseRisk")}</CardTitle>
					<ExperimentalLabel />
				</div>
				<p className="flex items-center gap-1.5 text-sm text-muted-foreground">
					{stage && <StageIcon stage={stage} className="h-5 w-5" />}
					{stage
						? t(`phenology.stages.${stage}.label`)
						: t("phenology.unknown")}
				</p>
			</CardHeader>
			<CardContent className="space-y-1">
				<ul className="space-y-3">
					{rows.map(({ diseaseId, timeline }) => (
						<DiseaseRiskRow
							key={diseaseId}
							diseaseId={diseaseId}
							timeline={timeline}
							currentStage={stage}
							isCritical={criticalDiseaseIds.includes(diseaseId)}
						/>
					))}
				</ul>
				<p className="flex justify-between text-[10px] text-muted-foreground">
					<span>{t(`phenology.stages.${PHENOLOGICAL_STAGES[0]}.label`)}</span>
					<span>{t(`phenology.stages.${PHENOLOGICAL_STAGES[7]}.label`)}</span>
				</p>
			</CardContent>
		</Card>
	);
}
