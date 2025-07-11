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

interface SubstanceUsageSectionProps {
	substanceData: SubstanceData[];
	title?: string;
	description?: string;
}

export function SubstanceUsageSection({
	substanceData,
	title = "Substance Usage This Year",
	description = "Track your substance applications across all treatments",
}: SubstanceUsageSectionProps) {
	const hasSubstanceData = substanceData.length > 0;

	return (
		<div className="space-y-4">
			<Card className="bg-card">
				<CardHeader>
					<CardTitle>{title}</CardTitle>
					<CardDescription>{description}</CardDescription>
				</CardHeader>
				<CardContent>
					<SubstanceChart data={substanceData} />
				</CardContent>
			</Card>

			{hasSubstanceData && (
				<div className="grid gap-4">
					<h2 className="text-lg font-semibold">Cumulated Doses</h2>
					{substanceData.map((substance) => (
						<Card key={substance.name}>
							<CardContent className="p-4">
								<div className="flex justify-between items-center gap-2">
									<div className="flex items-center gap-2">
										<SubstanceCircle substanceName={substance.name} />
										<div>
											<h3 className="font-medium">{substance.name}</h3>
											<p className="text-sm text-muted-foreground">
												{substance.totalDoseOfProduct.toFixed(2)} gr of product
											</p>
											<p className="text-sm text-muted-foreground">
												{Math.round(substance.totalUsedOfPureActiveSubstance)}{" "}
												gr of pure active substance
											</p>
											<p className="text-sm text-muted-foreground">
												{Math.round(
													substance.totalUsedOfPureActiveSubstancePerHa,
												)}{" "}
												kg/ha of pure active substance
											</p>
										</div>
									</div>
									<div className="text-right">
										<p className="text-xs text-muted-foreground">
											Max: {substance.maxDosage} kg/ha
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
					))}
				</div>
			)}
		</div>
	);
}
