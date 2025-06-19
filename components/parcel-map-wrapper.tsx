"use client";

import type { ParcelMapProps } from "@/components/parcel-map";
import dynamic from "next/dynamic";

// Dynamic import for the map component to improve performance
const ParcelMap = dynamic(
	() =>
		import("@/components/parcel-map").then((mod) => ({
			default: mod.ParcelMap,
		})),
	{
		ssr: false,
		loading: () => (
			<div className="animate-pulse h-64 bg-gray-200 rounded"></div>
		),
	},
);

export function ParcelMapWrapper({
	parcels,
	highlightParcelId,
	onMapClick,
}: ParcelMapProps) {
	return (
		<ParcelMap
			parcels={parcels}
			highlightParcelId={highlightParcelId}
			onMapClick={onMapClick}
		/>
	);
}
