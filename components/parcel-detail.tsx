"use client";

import { type Disease, type Parcel, type Product } from "@prisma/client";
import { Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AddTreatmentDialog } from "./add-treatment-dialog";
import { SubstanceUsageSection } from "./substance-usage-section";
import { type ParcelWithTreatments, type SubstanceData } from "./types";
import { TreatmentCard } from "./ui/treatment-card";

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
									<TreatmentCard
										key={treatment.id}
										treatment={treatment}
										diseases={diseases}
									/>
								))}
							</div>
						)}
					</CardContent>
				</Card>
			</div>

			<SubstanceUsageSection
				substanceData={substanceData}
				description="Track your substance applications for this parcel"
			/>

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
