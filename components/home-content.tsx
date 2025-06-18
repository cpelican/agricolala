"use client";

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus } from "lucide-react";
import { SubstanceChart } from "./substance-chart";
import { ParcelWithTreatments, SubstanceData } from "./types";

interface HomeContentProps {
	parcels: ParcelWithTreatments[];
}

export function HomeContent({ parcels }: HomeContentProps) {
	if (parcels.length === 0) {
		return (
			<div className="p-4">
				<Card>
					<CardHeader className="text-center">
						<CardTitle>Welcome to Agraria</CardTitle>
						<CardDescription>
							To start managing your vineyard treatments, you need to add your
							first parcel.
						</CardDescription>
					</CardHeader>
					<CardContent className="text-center">
						<Button asChild className="bg-green-600 hover:bg-green-700">
							<Link href="/parcels">
								<Plus className="h-4 w-4 mr-2" />
								Add Your First Parcel
							</Link>
						</Button>
					</CardContent>
				</Card>
			</div>
		);
	}

	// Calculate substance usage data
	const substanceData = parcels.reduce(
		(acc, parcel) => {
			parcel.treatments.forEach((treatment) => {
				treatment.productApplications.forEach((app) => {
					app.product.composition.forEach((comp) => {
						const substanceName = comp.substance.name;
						const totalDose = (app.dose * comp.dose) / 1000; // Convert to kg

						if (!acc[substanceName]) {
							acc[substanceName] = {
								name: substanceName,
								totalUsed: 0,
								maxDosage: comp.substance.maxDosage,
								monthlyData: Array(12).fill(0),
								applications: [],
							};
						}

						acc[substanceName].totalUsed += totalDose;

						if (treatment.appliedDate) {
							const month = new Date(treatment.appliedDate).getMonth();
							acc[substanceName].monthlyData[month] += totalDose;
							acc[substanceName].applications.push({
								date: treatment.appliedDate,
								dose: totalDose,
								parcel: parcel.name,
							});
						}
					});
				});
			});
			return acc;
		},
		{} as Record<string, SubstanceData>,
	);

	const hasSubstanceData = Object.values(substanceData).length > 0;

	return (
		<div className="p-4 space-y-4">
			<Card>
				<CardHeader>
					<CardTitle>Substance Usage This Year</CardTitle>
					<CardDescription>
						Track your substance applications across all parcels
					</CardDescription>
				</CardHeader>
				<CardContent>
					<SubstanceChart data={Object.values(substanceData)} />
				</CardContent>
			</Card>

			{hasSubstanceData && (
				<div className="grid gap-4">
					<h2 className="text-lg font-semibold">Cumulated Doses</h2>
					{Object.values(substanceData).map((substance: SubstanceData) => (
						<Card key={substance.name}>
							<CardContent className="p-4">
								<div className="flex justify-between items-center">
									<div>
										<h3 className="font-medium">{substance.name}</h3>
										<p className="text-sm text-gray-600">
											{substance.totalUsed.toFixed(2)} kg/ha used
										</p>
									</div>
									<div className="text-right">
										<p className="text-sm text-gray-600">
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
