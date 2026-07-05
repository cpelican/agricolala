"use client";

import { Suspense, use } from "react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { SubstanceChart } from "./substance-chart";
import { SubstanceYearlyChart } from "./substance-yearly-chart";
import { type SubstanceData, type CoverageWidgetData } from "../types";
import { SubstanceCard } from "./substance-card";
import { useTranslations } from "@/contexts/translations-context";
import { type getAllYearsSubstanceAggregations } from "@/lib/data-fetcher";
import { TooltipProvider } from "@/components/ui/tooltip";

interface SubstanceUsageSectionProps {
	substanceData: SubstanceData[];
	title?: string;
	description?: string;
	allYearsData?: Awaited<ReturnType<typeof getAllYearsSubstanceAggregations>>;
	coverageDataPromise?: Promise<CoverageWidgetData | null>;
}

function SubstanceCardsWithCoverage({
	substanceData,
	coverageDataPromise,
}: {
	substanceData: SubstanceData[];
	coverageDataPromise: Promise<CoverageWidgetData | null>;
}) {
	const coverageData = use(coverageDataPromise);
	const { t } = useTranslations();

	return (
		<>
			{coverageData?.hasIncompleteWeatherHistory && (
				<p className="text-sm text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-md px-3 py-2">
					{t("coverage.incompleteWeatherData")}
				</p>
			)}
			{substanceData.map((substance) => {
				const coverage = coverageData?.substances.find(
					(s) => s.substanceName === substance.name,
				);

				return (
					<SubstanceCard
						key={substance.name}
						substance={substance}
						coverage={coverage}
						hasWeatherData={coverageData?.hasWeatherData ?? true}
					/>
				);
			})}
		</>
	);
}

export function SubstanceUsageSection({
	substanceData,
	title,
	description,
	allYearsData,
	coverageDataPromise,
}: SubstanceUsageSectionProps) {
	const { t } = useTranslations();
	const hasSubstanceData = substanceData.length > 0;

	const defaultTitle = t("substances.usageThisYear");
	const defaultDescription = t("substances.trackApplications");

	return (
		<TooltipProvider>
			<div className="space-y-4">
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

				{hasSubstanceData && (
					<div className="grid gap-4">
						<h2 className="text-lg font-semibold">{t("substances.details")}</h2>

						{coverageDataPromise ? (
							<Suspense
								fallback={substanceData.map((substance) => (
									<SubstanceCard
										key={substance.name}
										substance={substance}
										hasWeatherData
									/>
								))}
							>
								<SubstanceCardsWithCoverage
									substanceData={substanceData}
									coverageDataPromise={coverageDataPromise}
								/>
							</Suspense>
						) : (
							substanceData.map((substance) => (
								<SubstanceCard
									key={substance.name}
									substance={substance}
									hasWeatherData
								/>
							))
						)}
					</div>
				)}

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
			</div>
		</TooltipProvider>
	);
}
