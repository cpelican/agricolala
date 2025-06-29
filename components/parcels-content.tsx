"use client";

import { MapPin, X, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AddParcelDialog } from "./add-parcel-dialog";
import { ParcelMapWrapper } from "./parcel-map-wrapper";
import { type ParcelWithTreatments } from "@/lib/data-fetcher";

interface ParcelsContentProps {
	parcels: ParcelWithTreatments[];
}

export function ParcelsContent({ parcels }: ParcelsContentProps) {
	const [showAddDialog, setShowAddDialog] = useState(false);
	const [showEmptyState, setShowEmptyState] = useState(true);
	const [selectedLocation, setSelectedLocation] = useState<{
		lat: number;
		lng: number;
	} | null>(null);

	const handleMapClick = (lat: number, lng: number) => {
		setSelectedLocation({ lat, lng });
		setShowAddDialog(true);
	};

	return (
		<div className="p-4 space-y-4">
			<div className="flex justify-between items-center">
				<h2 className="text-lg font-semibold">Your Parcels</h2>
				<p className="text-sm text-gray-500">
					Click on the map to add a parcel
				</p>
			</div>

			<Card>
				<CardContent className="p-0">
					<ParcelMapWrapper parcels={parcels} onMapClick={handleMapClick} />
					{parcels.length === 0 && showEmptyState && (
						<div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white/90 p-8 rounded-lg shadow-lg text-center">
							<Button
								variant="ghost"
								size="sm"
								className="absolute top-3 right-3 h-6 w-6 p-0"
								onClick={() => setShowEmptyState(false)}
							>
								<X className="h-4 w-4" />
							</Button>
							<p className="text-gray-700 font-medium">
								Click on the map to add your first parcel
							</p>
							<p className="text-sm text-gray-500 mt-1">
								Zoom in to find your exact location
							</p>
						</div>
					)}
				</CardContent>
			</Card>

			{parcels.length > 0 && (
				<div className="grid gap-4">
					{parcels.map((parcel) => (
						<Card key={parcel.id}>
							<CardContent className="p-4 flex justify-between items-start items-center">
								<Link href={`/parcels/${parcel.id}`} className="flex-1">
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
								</Link>
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
