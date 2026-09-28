"use client";

import { type Parcel } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SubstanceUsageSection } from "../substances/substance-usage-section";
import { type SubstanceData } from "../types";
import { TreatmentCard } from "../treatments/treatment-card";
import { type ParcelDetailType } from "@/lib/data-fetcher";
import type { CurrentParcelStage } from "@/lib/phenology-observations";
import { ParcelStageRow } from "../phenology/parcel-stage-row";
import { AddTreatmentButton } from "../treatments/add-treatment-button";
import { useDiseases, useCompositions } from "@/contexts/cached-data-context";
import { useTranslations } from "@/contexts/translations-context";

interface ParcelDetailProps {
	parcel: Pick<
		Parcel,
		"id" | "name" | "latitude" | "longitude" | "width" | "height" | "type"
	>;
	upcomingTreatments: ParcelDetailType["treatments"];
	pastTreatments: ParcelDetailType["treatments"];
	substanceData: SubstanceData[];
	currentStage: CurrentParcelStage | null;
	children: React.ReactNode;
}

export function ParcelDetail({
	parcel,
	upcomingTreatments,
	pastTreatments,
	substanceData,
	currentStage,
	children,
}: ParcelDetailProps) {
	const { t } = useTranslations();
	const diseases = useDiseases();
	const compositions = useCompositions();

	return (
		<div className="p-4 space-y-4">
			<div className="grid gap-4">
				<AddTreatmentButton
					parcelId={parcel.id}
					parcels={[]}
					stages={currentStage ? [currentStage] : []}
				/>
				<Card>
					<CardContent className="p-4">
						<ParcelStageRow
							parcelId={parcel.id}
							parcelName={parcel.name}
							observation={currentStage}
						/>
					</CardContent>
				</Card>
				{children}
				{upcomingTreatments.length === 0 ? null : (
					<Card>
						<CardHeader>
							<CardTitle>{t("parcels.upcomingTreatments")}</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="space-y-4">
								{upcomingTreatments.map((treatment) => (
									<div key={treatment.id} className="border rounded-lg p-4">
										<div className="mt-2 space-y-2">
											{treatment.productApplications.map((app, index) => {
												if (app.product.composition.length === 0) {
													return (
														<div key={index} className="text-sm">
															<p>
																{app.product.name} - {app.dose}
																{t("parcels.productDose")}
															</p>
														</div>
													);
												}

												const compositionLine = app.product.composition
													.map((comp) => {
														const substance =
															compositions[comp.substanceId]?.[app.product.id]
																?.substance;
														if (!substance) {
															return null;
														}
														return `${substance.name} (${comp.dose}%)`;
													})
													.filter(Boolean)
													.join(", ");

												return (
													<div key={index} className="text-sm">
														<p>
															{app.product.name} - {app.dose}
															{t("parcels.productDose")}
														</p>
														{compositionLine ? (
															<p className="text-muted-foreground">
																{compositionLine}
															</p>
														) : null}
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
						{t("parcels.pastTreatments")}
					</h2>
					<div className="space-y-3">
						{pastTreatments.length === 0 ? (
							<p className="text-muted-foreground">
								{t("parcels.noPastTreatments")}
							</p>
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
				description={t("parcels.trackSubstanceApplications")}
			/>
		</div>
	);
}
