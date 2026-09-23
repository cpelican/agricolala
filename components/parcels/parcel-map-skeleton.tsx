import { Skeleton } from "@/components/ui/skeleton";

/** Keep in sync with `ParcelMap` container height to avoid CLS. */
export const PARCEL_MAP_HEIGHT_PX = 400;

export function ParcelMapSkeleton() {
	return (
		<Skeleton
			className="w-full rounded-lg"
			style={{ height: PARCEL_MAP_HEIGHT_PX, minHeight: PARCEL_MAP_HEIGHT_PX }}
		/>
	);
}
