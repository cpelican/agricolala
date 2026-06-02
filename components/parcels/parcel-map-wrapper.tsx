"use client";

import type { ParcelMapProps } from "@/components/parcels/parcel-map";
import { ParcelMapSkeleton } from "@/components/parcels/parcel-map-skeleton";
import dynamic from "next/dynamic";

const ParcelMap = dynamic(
	() =>
		import("@/components/parcels/parcel-map").then((mod) => ({
			default: mod.ParcelMap,
		})),
	{
		ssr: false,
		loading: () => <ParcelMapSkeleton />,
	},
);

export function ParcelMapWrapper({
	parcels,
	highlightParcelId,
	drawing,
}: ParcelMapProps) {
	return (
		<ParcelMap
			parcels={parcels}
			highlightParcelId={highlightParcelId}
			drawing={drawing}
		/>
	);
}
