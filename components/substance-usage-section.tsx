"use client";

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { SubstanceChart } from "./substance-chart";
import { type SubstanceData } from "./types";
import { SubstanceCircle } from "./substance-circle";
import { useTranslations } from "@/contexts/translations-context";

interface SubstanceUsageSectionProps {
	substanceData: SubstanceData[];
	title?: string;
	description?: string;
}

export function SubstanceUsageSection({
	substanceData,
	title,
	description,
}: SubstanceUsageSectionProps) {
	const { t, getSubstanceTranslation } = useTranslations();
	const hasSubstanceData = substanceData.length > 0;

	const defaultTitle = t("substances.usageThisYear");
	const defaultDescription = t("substances.trackApplications");

	return (
		<div className="space-y-4">
			<Card className="bg-card">
				<CardHeader>
					<CardTitle>{title || defaultTitle}</CardTitle>
					<CardDescription>{description || defaultDescription}</CardDescription>
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

						return (
							<Card key={substance.name}>
								<CardContent className="p-4">
									<div className="flex justify-between items-center gap-2">
										<div className="flex items-center gap-2">
											<SubstanceCircle substanceName={substance.name} />
											<div>
												<h3 className="font-medium">{translatedName}</h3>
												<p className="text-sm text-muted-foreground">
													{substance.totalDoseOfProduct.toFixed(2)}{" "}
													{t("substances.grOfProduct")}
												</p>
												<p className="text-sm text-muted-foreground">
													{Math.round(substance.totalUsedOfPureActiveSubstance)}{" "}
													{t("substances.grOfPureActiveSubstance")}
												</p>
												<p className="text-sm text-muted-foreground">
													{Math.round(
														substance.totalUsedOfPureActiveSubstancePerHa,
													)}{" "}
													{t("substances.kgPerHa")}
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
		</div>
	);
}
