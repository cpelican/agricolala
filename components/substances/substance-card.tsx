"use client";

import { Suspense, use } from "react";
import { type PhenologicalStage } from "@prisma/client";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
	type SubstanceData,
	type SubstanceCoverage,
	type CoverageResult,
} from "../types";
import { SubstanceCircle } from "./substance-circle";
import { CumulatedDoseSection } from "./cumulated-dose-section";
import { CardSectionHeader } from "./card-section-header";
import {
	ResidualPanel,
	getResidualPanelProps,
} from "./coverage-residual-panel";
import {
	CoverageHiddenNote,
	type CoverageNoteReason,
	ProtectionPill,
	getCoverageHeadline,
	isCoverageTracked,
} from "./coverage-headline";
import { DiseaseBadges } from "./disease-badges";
import { useTranslations } from "@/contexts/translations-context";
import { useSubstances } from "@/contexts/cached-data-context";
import { type SubstanceStageRisk } from "@/lib/disease-stage-sensitivity";
import { ShieldCheck } from "lucide-react";
import { SUBSTANCE_FALLBACK_COLOR } from "@/lib/substance-colors";

type SubstanceCoverageState =
	| { kind: "available"; coverage: SubstanceCoverage; hasWeatherData: boolean }
	| { kind: "hidden"; reason: CoverageNoteReason }
	// Season-wide reasons are explained once above the cards, not in each card.
	| { kind: "explainedAbove" };

function getSubstanceCoverageState(
	result: CoverageResult,
	substanceName: string,
): SubstanceCoverageState {
	if (result.status === "hidden" && result.reason !== "noCompletedTreatments") {
		return { kind: "explainedAbove" };
	}
	if (!isCoverageTracked(substanceName)) {
		return { kind: "hidden", reason: "notTracked" };
	}
	const coverage =
		result.status === "available"
			? result.data.substances.find((s) => s.substanceName === substanceName)
			: undefined;
	if (!coverage || result.status !== "available") {
		return { kind: "hidden", reason: "noCompletedTreatments" };
	}
	return {
		kind: "available",
		coverage,
		hasWeatherData: result.data.hasWeatherData,
	};
}

function CoverageSection({
	substanceName,
	coverageResultPromise,
}: {
	substanceName: string;
	coverageResultPromise: Promise<CoverageResult>;
}) {
	const { t, locale } = useTranslations();
	const state = getSubstanceCoverageState(
		use(coverageResultPromise),
		substanceName,
	);

	if (state.kind === "explainedAbove") return null;

	const panelProps =
		state.kind === "available"
			? getResidualPanelProps(state.coverage, state.hasWeatherData, t, locale)
			: null;
	if (panelProps) return <ResidualPanel {...panelProps} />;

	return (
		<div className="border-t pt-4 space-y-2">
			<CardSectionHeader
				icon={ShieldCheck}
				title={t("coverage.title")}
				experimental
			/>
			<CoverageHiddenNote
				reason={state.kind === "hidden" ? state.reason : "notTracked"}
			/>
		</div>
	);
}

function CoverageHeadline({
	substanceName,
	coverageResultPromise,
	isCriticalPeriod,
}: {
	substanceName: string;
	coverageResultPromise: Promise<CoverageResult>;
	isCriticalPeriod: boolean;
}) {
	const state = getSubstanceCoverageState(
		use(coverageResultPromise),
		substanceName,
	);
	if (state.kind !== "available") return null;

	const headline = getCoverageHeadline(state.coverage, isCriticalPeriod);
	if (!headline) return null;

	return <ProtectionPill value={headline.value} advice={headline.advice} />;
}

interface SubstanceCardProps {
	substance: SubstanceData;
	coverageResultPromise?: Promise<CoverageResult>;
	stageRisk?: SubstanceStageRisk;
	pacingStage?: PhenologicalStage | null;
}

export function SubstanceCard({
	substance,
	coverageResultPromise,
	stageRisk,
	pacingStage,
}: SubstanceCardProps) {
	const { getSubstanceTranslation } = useTranslations();
	const substances = useSubstances();
	const translatedName = getSubstanceTranslation(substance.name);
	const substanceMeta = substances.find((s) => s.name === substance.name);
	const substanceColor = substanceMeta?.color ?? SUBSTANCE_FALLBACK_COLOR;

	return (
		<Card>
			<CardContent className="space-y-3.5 p-5">
				<div className="flex flex-wrap items-center justify-between gap-2">
					<div className="flex items-center gap-2.5">
						<SubstanceCircle substanceName={substance.name} />
						<h3 className="m-0 text-lg leading-7 font-semibold">
							{translatedName}
						</h3>
					</div>
					{coverageResultPromise && (
						<Suspense fallback={null}>
							<CoverageHeadline
								substanceName={substance.name}
								coverageResultPromise={coverageResultPromise}
								isCriticalPeriod={stageRisk?.isCritical ?? false}
							/>
						</Suspense>
					)}
				</div>
				<DiseaseBadges
					diseaseIds={substanceMeta?.diseaseIds ?? []}
					risk={stageRisk}
				/>

				{coverageResultPromise && (
					<Suspense
						fallback={
							<div className="border-t pt-4">
								<Skeleton className="h-24 w-full" />
							</div>
						}
					>
						<CoverageSection
							substanceName={substance.name}
							coverageResultPromise={coverageResultPromise}
						/>
					</Suspense>
				)}

				<CumulatedDoseSection
					substance={substance}
					substanceColor={substanceColor}
					showTitle={Boolean(coverageResultPromise)}
					pacingStage={pacingStage}
				/>
			</CardContent>
		</Card>
	);
}
