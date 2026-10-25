"use client";

import {
	DiseaseSensitivityLevel,
	type PhenologicalStage,
} from "@prisma/client";
import { Info } from "lucide-react";
import { Suspense, use } from "react";
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
import { type CoverageResult } from "@/components/types";

const LEVEL_COLORS: Record<DiseaseSensitivityLevel, string> = {
	[DiseaseSensitivityLevel.NONE]: "bg-risk-none",
	[DiseaseSensitivityLevel.LOW]: "bg-risk-low",
	[DiseaseSensitivityLevel.MEDIUM]: "bg-risk-medium",
	[DiseaseSensitivityLevel.HIGH]: "bg-risk-high",
	[DiseaseSensitivityLevel.VERY_HIGH]: "bg-risk-very-high",
};
// Levels shown in the legend, lowest first.
const LEGEND_LEVELS = [
	DiseaseSensitivityLevel.LOW,
	DiseaseSensitivityLevel.MEDIUM,
	DiseaseSensitivityLevel.HIGH,
	DiseaseSensitivityLevel.VERY_HIGH,
] as const;
const HIGH_LEVELS = new Set<DiseaseSensitivityLevel>([
	DiseaseSensitivityLevel.HIGH,
	DiseaseSensitivityLevel.VERY_HIGH,
]);
// Stage with no matrix row for the disease.
const UNKNOWN_LEVEL_COLOR = "bg-muted";
// One disease: its name, a thin band of the 8 stages coloured by its level with the
// current stage ringed and the others faded. Tapping it
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
	// Level at the current stage; undefined when no stage is known.
	const currentLevel = currentStage
		? (timeline.find((entry) => entry.stage === currentStage)?.level ?? null)
		: undefined;

	return (
		<li data-testid="disease-risk-row">
			<Popover>
				<PopoverTrigger asChild>
					<button
						type="button"
						className="block w-full space-y-1.5 rounded-sm text-left"
						aria-label={t("phenology.riskByStage").replace("{disease}", name)}
					>
						<span className="flex items-baseline justify-between gap-2">
							<span className="text-sm leading-5 font-medium">{name}</span>
							{currentLevel !== undefined && (
								<span
									className={cn(
										"text-xs leading-4 font-semibold",
										currentLevel && HIGH_LEVELS.has(currentLevel)
											? "text-destructive"
											: "text-neutral-600",
									)}
								>
									{levelLabel(currentLevel)}
								</span>
							)}
						</span>
						<ol className="grid grid-cols-8 gap-[3px]">
							{timeline.map(({ stage, level }) => (
								<li
									key={stage}
									className={cn(
										"h-2 rounded-[2px]",
										level ? LEVEL_COLORS[level] : UNKNOWN_LEVEL_COLOR,
										stage === currentStage
											? "-mt-0.5 h-3 ring-2 ring-foreground ring-offset-1"
											: currentStage && "opacity-45",
									)}
									data-stage={stage}
									data-current={stage === currentStage || undefined}
								/>
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
						{timeline.map(({ stage, level }) => (
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
							</li>
						))}
					</ul>
					<p className="text-muted-foreground">
						{t("phenology.riskTimelineTooltip")}
					</p>
				</PopoverContent>
			</Popover>
		</li>
	);
}

// Shown in the header when no disease is active on any parcel (by its stage, or by
// month without one), instead of above the substance cards.
function NoActiveDiseaseNote({
	coverageResultPromise,
}: {
	coverageResultPromise: Promise<CoverageResult>;
}) {
	const { t } = useTranslations();
	const result = use(coverageResultPromise);
	if (result.status !== "hidden" || result.reason !== "noActiveDisease") {
		return null;
	}
	return (
		<p className="flex items-start gap-2 text-xs text-muted-foreground">
			<Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
			{t("phenology.noActiveDisease")}
		</p>
	);
}

// Top of the dashboard: the vines' stage (the riskiest among the parcels' current
// stages) and, per disease, its risk across the season. The substance cards only
// name the diseases they target.
export function DiseaseRiskSection({
	stage,
	criticalDiseaseIds,
	rows,
	coverageResultPromise,
}: {
	stage: PhenologicalStage | null;
	criticalDiseaseIds: string[];
	rows: { diseaseId: string; timeline: DiseaseRiskTimeline }[];
	coverageResultPromise: Promise<CoverageResult>;
}) {
	const { t } = useTranslations();

	return (
		<Card data-testid="disease-risk-section">
			<CardHeader className="space-y-4 p-5 pb-4">
				<div className="flex flex-wrap items-center gap-2.5">
					<CardTitle className="text-lg leading-7">
						{t("phenology.diseaseRisk")}
					</CardTitle>
					<ExperimentalLabel />
				</div>
				<div className="flex items-center gap-2.5 rounded-lg bg-primary-50 px-3 py-2.5">
					{stage && <StageIcon stage={stage} className="size-7 flex-none" />}
					<div className="flex flex-col">
						<span className="text-sm leading-5 font-semibold text-primary-700">
							{stage
								? t(`phenology.stages.${stage}.label`)
								: t("phenology.unknown")}
						</span>
						{stage && (
							<span className="text-xs leading-4 text-neutral-700">
								{t("phenology.stageNumber")
									.replace("{n}", String(PHENOLOGICAL_STAGES.indexOf(stage) + 1))
									.replace("{total}", String(PHENOLOGICAL_STAGES.length))}
							</span>
						)}
					</div>
				</div>
				<Suspense fallback={null}>
					<NoActiveDiseaseNote coverageResultPromise={coverageResultPromise} />
				</Suspense>
			</CardHeader>
			<CardContent className="space-y-3 p-5 pt-0">
				<ul className="space-y-3.5">
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
				<p className="m-0 flex justify-between text-xs leading-4 text-muted-foreground">
					<span>{t(`phenology.stages.${PHENOLOGICAL_STAGES[0]}.label`)}</span>
					<span>{t(`phenology.stages.${PHENOLOGICAL_STAGES[7]}.label`)}</span>
				</p>
				<ul
					aria-label={t("phenology.riskLegend")}
					className="m-0 flex list-none flex-wrap gap-3 border-t border-border p-0 pt-3 text-xs leading-4 text-neutral-600"
				>
					{LEGEND_LEVELS.map((level) => (
						<li key={level} className="inline-flex items-center gap-1.5">
							<span
								aria-hidden
								className={cn("size-2.5 rounded-[2px]", LEVEL_COLORS[level])}
							/>
							{t(`phenology.levels.${level}`)}
						</li>
					))}
				</ul>
			</CardContent>
		</Card>
	);
}
