"use client";

import { type Disease, type Parcel, type Product } from "@prisma/client";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { AddTreatmentDialog } from "./add-treatment-dialog";
import { SubstanceChart } from "./substance-chart";
import { type ParcelWithTreatments, type SubstanceData } from "./types";

interface ParcelDetailProps {
	parcel: Pick<
		Parcel,
		"id" | "name" | "latitude" | "longitude" | "width" | "height" | "type"
	>;
	upcomingTreatments: ParcelWithTreatments["treatments"];
	pastTreatments: ParcelWithTreatments["treatments"];
	substanceData: SubstanceData[];
	diseases: Pick<Disease, "id" | "name">[];
	products: Pick<Product, "id" | "name">[];
}

export function ParcelDetail({
	parcel,
	diseases,
	products,
	upcomingTreatments,
	pastTreatments,
	substanceData,
}: ParcelDetailProps) {
	const [isAddTreatmentOpen, setIsAddTreatmentOpen] = useState(false);
	const hasSubstanceData = substanceData.length > 0;

	return (
		<div className="p-4 space-y-4">
			<div className="grid gap-4 md:grid-cols-2">
				<Button
					onClick={() => setIsAddTreatmentOpen(true)}
					className="fixed bottom-20 right-6 h-14 w-14 rounded-full shadow-lg"
					size="icon"
				>
					<Plus className="h-6 w-6" />
				</Button>
				<Card>
					<CardHeader>
						<CardTitle>Upcoming Treatments</CardTitle>
					</CardHeader>
					<CardContent>
						{upcomingTreatments.length === 0 ? (
							<p className="text-muted-foreground">No upcoming treatments</p>
						) : (
							<div className="space-y-4">
								{upcomingTreatments.map((treatment) => (
									<div key={treatment.id} className="border rounded-lg p-4">
										<div className="mt-2 space-y-2">
											{treatment.productApplications.map((app, index) => (
												<div key={index} className="text-sm">
													<p>
														{app.product.name} - {app.dose}L/ha
													</p>
													<p className="text-muted-foreground">
														{app.product.composition
															.map(
																(comp) =>
																	`${comp.substance.name} (${comp.dose}%)`,
															)
															.join(", ")}
													</p>
												</div>
											))}
										</div>
									</div>
								))}
							</div>
						)}
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Past Treatments</CardTitle>
					</CardHeader>
					<CardContent>
						{pastTreatments.length === 0 ? (
							<p className="text-muted-foreground">No past treatments</p>
						) : (
							<div className="space-y-4">
								{pastTreatments.map((treatment) => (
									<div key={treatment.id} className="border rounded-lg p-4">
										<p className="text-sm text-muted-foreground">
											{treatment.appliedDate &&
												format(treatment.appliedDate, "PPP", { locale: fr })}
										</p>
										<div className="mt-2 space-y-2">
											{treatment.productApplications.map((app, index) => (
												<div key={index} className="text-sm">
													<p>
														{app.product.name} - {app.dose}L/ha
													</p>
													<p className="text-muted-foreground">
														{app.product.composition
															.map(
																(comp) =>
																	`${comp.substance.name} (${comp.dose}%)`,
															)
															.join(", ")}
													</p>
												</div>
											))}
										</div>
									</div>
								))}
							</div>
						)}
					</CardContent>
				</Card>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Substance Usage This Year</CardTitle>
					<CardDescription>
						Track your substance applications across all treatments
					</CardDescription>
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

			<AddTreatmentDialog
				open={isAddTreatmentOpen}
				onOpenChange={setIsAddTreatmentOpen}
				parcelId={parcel.id}
				diseases={diseases}
				products={products}
			/>
		</div>
	);
}
