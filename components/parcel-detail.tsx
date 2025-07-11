"use client";

import { type Parcel } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DeleteParcelButton } from "./delete-parcel-button";
import { SubstanceUsageSection } from "./substance-usage-section";
import { type SubstanceData } from "./types";
import { TreatmentCard } from "./treatment-card";
import { type ParcelDetailType } from "@/lib/data-fetcher";
import { AddTreatmentButton } from "./add-treatment-button";
import { useDiseases, useCompositions } from "@/contexts/cached-data-context";

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
	const compositions = useCompositions();

	return (
		<div className="p-4 space-y-4">
			<div className="flex justify-end items-center">
				<DeleteParcelButton
					parcelId={parcel.id}
					parcelName={parcel.name}
					redirectTo="/parcels"
					className="absolute top-6"
					iconSize="md"
				/>
			</div>

			<div className="grid gap-4">
				<AddTreatmentButton parcelId={parcel.id} parcels={[]} />
				{upcomingTreatments.length === 0 ? null : (
					<Card>
						<CardHeader>
							<CardTitle>Upcoming Treatments</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="space-y-4">
								{upcomingTreatments.map((treatment) => (
									<div key={treatment.id} className="border rounded-lg p-4">
										<div className="mt-2 space-y-2">
											{treatment.productApplications.map((app, index) => {
												const substance =
													compositions[app.product.composition[0].substanceId][
														app.product.id
													]?.substance;
												return (
													<div key={index} className="text-sm">
														<p>
															{app.product.name} - {app.dose}L/ha
														</p>
														<p className="text-muted-foreground">
															{app.product.composition
																.map(
																	(comp) => `${substance.name} (${comp.dose}%)`,
																)
																.join(", ")}
														</p>
													</div>
												);
											})}
										</div>
									</div>
								))}
							</div>
						</CardContent>
					</Card>
				)}

				<div>
					<h2 className="text-lg font-semibold mb-3 flex items-center">
						Past Treatments
					</h2>
					<div className="space-y-3">
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
					</div>
				</div>
			</div>

			<SubstanceUsageSection
				substanceData={substanceData}
				description="Track your substance applications for this parcel"
			/>
		</div>
	);
}
