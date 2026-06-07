"use client";

import { MapPin, X, ChevronRight } from "lucide-react";
import { LocaleLink } from "../locale/locale-link";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AddParcelDialog } from "./add-parcel-dialog";
import { ParcelMapWrapper } from "./parcel-map-wrapper";
import { type ParcelWithTreatments } from "@/lib/data-fetcher";
import { useTranslations } from "@/contexts/translations-context";

interface ParcelsContentProps {
	parcels: ParcelWithTreatments[];
}

export function ParcelsContent({ parcels }: ParcelsContentProps) {
	const [showAddDialog, setShowAddDialog] = useState(false);
	const [showEmptyState, setShowEmptyState] = useState(true);
	const [selectedLocation, setSelectedLocation] = useState<{
		lat: number;
		lng: number;
		altitude?: number;
	} | null>(null);
	const { t } = useTranslations();

	const handleMapClick = (lat: number, lng: number, alt?: number) => {
		setSelectedLocation({ lat, lng, altitude: alt });
		setShowAddDialog(true);
	};

	return (
		<div className="p-4 space-y-4">
			<div className="flex justify-end items-center">
				<p className="text-sm text-gray-500">{t("parcels.clickMapToAdd")}</p>
			</div>

			<Card>
				<CardContent className="relative p-0">
					<ParcelMapWrapper parcels={parcels} onMapClick={handleMapClick} />
					{parcels.length === 0 && showEmptyState && (
						<div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center p-4">
							<div className="pointer-events-auto relative max-w-sm rounded-lg bg-white/90 p-8 text-center shadow-lg">
								<Button
									variant="ghost"
									size="sm"
									className="absolute top-3 right-3 h-6 w-6 p-0"
									onClick={() => setShowEmptyState(false)}
								>
									<X className="h-4 w-4" />
								</Button>
								<p className="text-gray-700 font-medium">
									{t("parcels.clickMapToAddFirst")}
								</p>
								<p className="mt-1 text-sm text-gray-500">
									{t("parcels.zoomInToFindLocation")}
								</p>
							</div>
						</div>
					)}
				</CardContent>
			</Card>

			{parcels.length > 0 && (
				<div className="grid gap-4">
					{parcels.map((parcel) => (
						<Card key={parcel.id}>
							<CardContent className="p-4 flex justify-between items-start items-center">
								<LocaleLink href={`/parcels/${parcel.id}`} className="flex-1">
									<div>
										<h3 className="font-medium">{parcel.name}</h3>
										<p className="text-sm text-gray-600 capitalize">
											{parcel.type.toLowerCase()}
										</p>
										<p className="text-sm text-gray-500">
											{parcel.width}m × {parcel.height}m (
											{((parcel.width * parcel.height) / 10000).toFixed(2)} ha)
										</p>
										<div className="flex items-center text-gray-400 mt-2">
											<MapPin className="h-4 w-4 mr-1" />
											<span className="text-xs">
												{parcel.latitude.toFixed(4)},{" "}
												{parcel.longitude.toFixed(4)}
											</span>
										</div>
									</div>
								</LocaleLink>
								<div className="">
									<ChevronRight className="h-6 w-6 text-gray-400" />
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			)}

			<AddParcelDialog
				open={showAddDialog}
				onOpenChange={setShowAddDialog}
				selectedLocation={selectedLocation}
			/>
		</div>
	);
}
