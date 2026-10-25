"use client";

import { Suspense, use, useId } from "react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { SubstanceChart } from "./substance-chart";
import { SubstanceYearlyChart } from "./substance-yearly-chart";
import { type SubstanceData, type CoverageResult } from "../types";
import { SubstanceCard } from "./substance-card";
import { CoverageHiddenNote } from "./coverage-headline";
import { useTranslations } from "@/contexts/translations-context";
import { type getAllYearsSubstanceAggregations } from "@/lib/data-fetcher";
import { TooltipProvider } from "@/components/ui/tooltip";
import { EYEBROW, SUBSECTION_TITLE } from "@/components/ui/typography";
import { type SubstanceStageRisk } from "@/lib/disease-stage-sensitivity";

interface SubstanceUsageSectionProps {
	substanceData: SubstanceData[];
	title?: string;
	description?: string;
	allYearsData?: Awaited<ReturnType<typeof getAllYearsSubstanceAggregations>>;
	coverageResultPromise?: Promise<CoverageResult>;
	// Keyed by substance name; a substance without an entry has no critical chip.
	stageRiskBySubstance?: Record<string, SubstanceStageRisk>;
	// The dashboard's disease risk section is shown and says when no disease is active.
	isNoActiveDiseaseShownAbove?: boolean;
}

// Season-wide coverage notices, shown once above the substance cards.
function CoverageNotice({
	coverageResultPromise,
	isNoActiveDiseaseShownAbove,
}: {
	coverageResultPromise: Promise<CoverageResult>;
	isNoActiveDiseaseShownAbove?: boolean;
}) {
	const result = use(coverageResultPromise);
	const { t } = useTranslations();

	if (result.status === "hidden") {
		// Per-substance reason: each card explains it itself.
		if (result.reason === "noCompletedTreatments") return null;
		if (result.reason === "noActiveDisease" && isNoActiveDiseaseShownAbove) {
			return null;
		}
		return <CoverageHiddenNote reason={result.reason} />;
	}

	if (!result.data.hasIncompleteWeatherHistory) return null;

	return (
		<p className="text-sm text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-md px-3 py-2">
			{t("coverage.incompleteWeatherData")}
		</p>
	);
}

export function SubstanceUsageSection({
	substanceData,
	title,
	description,
	allYearsData,
	coverageResultPromise,
	stageRiskBySubstance,
	isNoActiveDiseaseShownAbove,
}: SubstanceUsageSectionProps) {
	const { t } = useTranslations();
	const titleId = useId();
	const hasSubstanceData = substanceData.length > 0;

	const defaultTitle = t("substances.usageThisYear");
	const defaultDescription = t("substances.trackApplications");

	return (
		<TooltipProvider>
			<section aria-labelledby={titleId} className="space-y-4">
				<div className="flex flex-col gap-2">
					<p className={`m-0 ${EYEBROW}`}>{t("substances.usageEyebrow")}</p>
					<h2 id={titleId} className={SUBSECTION_TITLE}>
						{t("coverage.cumulatedDose")}
					</h2>
					<p className="m-0 text-sm leading-5 text-neutral-700">
						{t("coverage.cumulatedDoseSubtitle")}
					</p>
				</div>

				{hasSubstanceData && (
					<div className="grid gap-4">
						{coverageResultPromise && (
							<Suspense fallback={null}>
								<CoverageNotice
									coverageResultPromise={coverageResultPromise}
									isNoActiveDiseaseShownAbove={isNoActiveDiseaseShownAbove}
								/>
							</Suspense>
						)}
						{substanceData.map((substance) => (
							<SubstanceCard
								key={substance.name}
								substance={substance}
								coverageResultPromise={coverageResultPromise}
								stageRisk={stageRiskBySubstance?.[substance.name]}
							/>
						))}
					</div>
				)}

				<Card className="bg-card">
					<CardHeader>
						<CardTitle>{title || defaultTitle}</CardTitle>
						<CardDescription>
							{description || defaultDescription}
						</CardDescription>
					</CardHeader>
					<CardContent>
						<SubstanceChart data={substanceData} />
					</CardContent>
				</Card>

				{allYearsData && (
					<Card className="bg-card">
						<CardHeader>
							<CardTitle>{t("substances.yearlyComparison")}</CardTitle>
							<CardDescription>
								{t("substances.yearlyComparisonDescription")}
							</CardDescription>
						</CardHeader>
						<CardContent>
							<SubstanceYearlyChart allYearsData={allYearsData} />
						</CardContent>
					</Card>
				)}
			</section>
		</TooltipProvider>
	);
}
