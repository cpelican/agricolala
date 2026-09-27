"use client";

import { Suspense, use } from "react";
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
import { useTranslations } from "@/contexts/translations-context";
import { useSubstances } from "@/contexts/cached-data-context";
import { ShieldCheck } from "lucide-react";

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
			<CardSectionHeader icon={ShieldCheck} title={t("coverage.title")} />
			<CoverageHiddenNote
				reason={state.kind === "hidden" ? state.reason : "notTracked"}
			/>
		</div>
	);
}

function CoverageHeadline({
	substanceName,
	coverageResultPromise,
}: {
	substanceName: string;
	coverageResultPromise: Promise<CoverageResult>;
}) {
	const state = getSubstanceCoverageState(
		use(coverageResultPromise),
		substanceName,
	);
	if (state.kind !== "available") return null;

	const headline = getCoverageHeadline(state.coverage);
	if (!headline) return null;

	return <ProtectionPill value={headline.value} advice={headline.advice} />;
}

interface SubstanceCardProps {
	substance: SubstanceData;
	coverageResultPromise?: Promise<CoverageResult>;
}

export function SubstanceCard({
	substance,
	coverageResultPromise,
}: SubstanceCardProps) {
	const { getSubstanceTranslation } = useTranslations();
	const substances = useSubstances();
	const translatedName = getSubstanceTranslation(substance.name);
	const substanceColor =
		substances.find((s) => s.name === substance.name)?.color ||
		"rgb(182, 182, 182)";

	return (
		<Card>
			<CardContent className="p-4 space-y-4">
				<div className="flex items-center justify-between gap-2 flex-wrap">
					<div className="flex items-center gap-2">
						<SubstanceCircle substanceName={substance.name} />
						<h3 className="text-lg font-semibold">{translatedName}</h3>
					</div>
					{coverageResultPromise && (
						<Suspense fallback={null}>
							<CoverageHeadline
								substanceName={substance.name}
								coverageResultPromise={coverageResultPromise}
							/>
						</Suspense>
					)}
				</div>

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
				/>
			</CardContent>
		</Card>
	);
}
