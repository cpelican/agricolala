"use client";

import { type Parcel } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DeleteParcelButton } from "./delete-parcel-button";
import { SubstanceUsageSection } from "./substance-usage-section";
import { type SubstanceData } from "./types";
import { TreatmentCard } from "./treatment-card";
import { type ParcelDetailType } from "@/lib/parcel-helpers";
import { AddTreatmentButton } from "./add-treatment-button";
import { useDiseases } from "@/contexts/cached-data-context";

interface ParcelDetailProps {
	parcel: Pick<
		Parcel,
		"id" | "name" | "latitude" | "longitude" | "width" | "height" | "type"
	>;
	upcomingTreatments: ParcelDetailType["treatments"];
	pastTreatments: ParcelDetailType["treatments"];
	substanceData: SubstanceData[];
}

export function ParcelDetail({
	parcel,
	upcomingTreatments,
	pastTreatments,
	substanceData,
}: ParcelDetailProps) {
	const diseases = useDiseases();

	return (
		<div className="p-4 space-y-4">
			<div className="flex justify-between items-center mb-6">
				<div>
					<h1 className="text-2xl font-bold">{parcel.name}</h1>
					<p className="text-gray-600 capitalize">
						{parcel.type.toLowerCase()} - {parcel.width}m × {parcel.height}m (
						{((parcel.width * parcel.height) / 10_000).toFixed(2)} ha)
					</p>
				</div>
				<DeleteParcelButton
					parcelId={parcel.id}
					parcelName={parcel.name}
					redirectTo="/parcels"
					iconSize="md"
				/>
			</div>

			<div className="grid gap-4 md:grid-cols-2">
				<AddTreatmentButton parcelId={parcel.id} parcels={[]} />
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
										parcelName={parcel.name}
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
		</div>
	);
}
