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
import { useSubstances } from "@/contexts/cached-data-context";

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
	const substances = useSubstances();

	const getSubstanceColor = (substanceName: string) => {
		const substance = substances.find((s) => s.name === substanceName);
		return substance?.color || "rgb(182, 182, 182)";
	};

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
									<div className="flex items-center gap-2">
										<div
											className="w-3 h-3 rounded-full"
											style={{
												backgroundColor: getSubstanceColor(substance.name),
											}}
										/>
										<div>
											<h3 className="font-medium">{substance.name}</h3>
											<p className="text-sm text-muted-foreground">
												{substance.totalUsed.toFixed(2)} kg/ha used
											</p>
										</div>
									</div>
									<div className="text-right">
										<p className="text-sm text-muted-foreground">
											Max: {substance.maxDosage} kg/ha
										</p>
										<meter
											value={substance.totalUsed}
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
