"use client";

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { SubstanceChart } from "./substance-chart";
import { SubstanceYearlyChart } from "./substance-yearly-chart";
import { type SubstanceData } from "../types";
import { SubstanceCircle } from "./substance-circle";
import { useTranslations } from "@/contexts/translations-context";
import { type getAllYearsSubstanceAggregations } from "@/lib/data-fetcher";
import { TooltipProvider } from "@/components/ui/tooltip";
import { PercentageInfo } from "./substance-percentage";

interface SubstanceUsageSectionProps {
	substanceData: SubstanceData[];
	title?: string;
	description?: string;
	allYearsData?: Awaited<ReturnType<typeof getAllYearsSubstanceAggregations>>;
}

export function SubstanceUsageSection({
	substanceData,
	title,
	description,
	allYearsData,
}: SubstanceUsageSectionProps) {
	const { t, getSubstanceTranslation } = useTranslations();
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
						<h2 className="text-lg font-semibold">
							{t("substances.cumulatedDoses")}
						</h2>
						{substanceData.map((substance) => {
							const translatedName = getSubstanceTranslation(substance.name);
							const lastYear = new Date().getFullYear() - 1;
							const lastYearData = allYearsData?.[lastYear]?.[substance.name];

							return (
								<Card key={substance.name}>
									<CardContent className="p-4">
										<div className="flex justify-between items-center gap-2">
											<div className="flex items-center gap-2">
												<SubstanceCircle substanceName={substance.name} />
												<div>
													<div className="flex items-center gap-2">
														<h3 className="font-medium">{translatedName}</h3>
														<PercentageInfo
															currentYearData={substance}
															lastYearData={lastYearData}
														/>
													</div>
													<p className="text-sm text-muted-foreground">
														{substance.totalDoseOfProduct.toFixed(2)}{" "}
														{t("substances.grOfProduct")}
														{lastYearData && (
															<span className="ml-2 text-xs">
																({lastYearData.totalDoseOfProduct.toFixed(2)}{" "}
																{t("substances.lastYear")})
															</span>
														)}
													</p>
													<p className="text-sm text-muted-foreground">
														{Math.round(
															substance.totalUsedOfPureActiveSubstance,
														)}{" "}
														{t("substances.grOfPureActiveSubstance")}
														{lastYearData && (
															<span className="ml-2 text-xs">
																(
																{Math.round(
																	lastYearData.totalUsedOfPureActiveSubstance,
																)}{" "}
																{t("substances.lastYear")})
															</span>
														)}
													</p>
													<p className="text-sm text-muted-foreground">
														{Math.round(
															substance.totalUsedOfPureActiveSubstancePerHa,
														)}{" "}
														{t("substances.kgPerHa")}
														{lastYearData && (
															<span className="ml-2 text-xs">
																(
																{Math.round(
																	lastYearData.totalUsedOfPureActiveSubstancePerHa,
																)}{" "}
																{t("substances.lastYear")})
															</span>
														)}
													</p>
												</div>
											</div>
											<div className="text-right">
												<p className="text-xs text-muted-foreground">
													{t("substances.max")}: {substance.maxDosage} kg/ha
												</p>
												<meter
													value={substance.totalUsedOfPureActiveSubstancePerHa}
													max={substance.maxDosage}
													high={substance.maxDosage * 0.8}
													optimum={substance.maxDosage * 0.4}
													low={substance.maxDosage * 0.6}
												/>
											</div>
										</div>
									</CardContent>
								</Card>
							);
						})}
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
