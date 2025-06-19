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
			<Card>
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
								<div className="flex justify-between items-center">
									<div>
										<h3 className="font-medium">{substance.name}</h3>
										<p className="text-sm text-muted-foreground">
											{substance.totalUsed.toFixed(2)} kg/ha used
										</p>
									</div>
									<div className="text-right">
										<p className="text-sm text-muted-foreground">
											Max: {substance.maxDosage} kg/ha
										</p>
										<div className="w-24 bg-gray-200 rounded-full h-2 mt-1">
											<div
												className={`h-2 rounded-full ${
													substance.totalUsed / substance.maxDosage > 0.8
														? "bg-red-500"
														: substance.totalUsed / substance.maxDosage > 0.6
															? "bg-yellow-500"
															: "bg-green-500"
												}`}
												style={{
													width: `${Math.min(100, (substance.totalUsed / substance.maxDosage) * 100)}%`,
												}}
											/>
										</div>
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
