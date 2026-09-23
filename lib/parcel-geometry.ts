import area from "@turf/area";
import centroid from "@turf/centroid";
import { polygon } from "@turf/helpers";
import kinks from "@turf/kinks";
import type { Prisma } from "@prisma/client";
import z from "zod";

export const MIN_PARCEL_AREA_M2 = 10;
export const MAX_BOUNDARY_VERTICES = 200;

export const parcelBoundaryPointSchema = z.object({
	lat: z.number().min(-90).max(90),
	lng: z.number().min(-180).max(180),
});

export const parcelBoundarySchema = z
	.array(parcelBoundaryPointSchema)
	.min(3, "At least 3 points are required")
	.max(MAX_BOUNDARY_VERTICES);

export type ParcelBoundaryPoint = z.infer<typeof parcelBoundaryPointSchema>;
export type ParcelBoundary = z.infer<typeof parcelBoundarySchema>;

export interface ParcelAreaFields {
	areaM2?: number | null;
	width: number;
	height: number;
}

export function getParcelAreaM2(parcel: ParcelAreaFields): number {
	if (parcel.areaM2 != null && parcel.areaM2 > 0) {
		return parcel.areaM2;
	}
	return parcel.width * parcel.height;
}

export function boundaryToGeoJsonPolygon(boundary: ParcelBoundary) {
	const ring = boundary.map((p) => [p.lng, p.lat] as [number, number]);
	// Close the ring for GeoJSON
	const first = ring[0];
	const last = ring[ring.length - 1];
	if (first[0] !== last[0] || first[1] !== last[1]) {
		ring.push([...first]);
	}
	return polygon([ring]);
}

export function computeParcelAreaM2(boundary: ParcelBoundary): number {
	return area(boundaryToGeoJsonPolygon(boundary));
}

export function computeParcelCentroid(boundary: ParcelBoundary): {
	lat: number;
	lng: number;
} {
	const center = centroid(boundaryToGeoJsonPolygon(boundary));
	const [lng, lat] = center.geometry.coordinates;
	return { lat, lng };
}

export function validateBoundary(boundary: ParcelBoundary): void {
	const geoJson = boundaryToGeoJsonPolygon(boundary);
	const selfIntersections = kinks(geoJson);
	if (selfIntersections.features.length > 0) {
		throw new Error("INVALID_BOUNDARY_SHAPE");
	}
	const areaM2 = area(geoJson);
	if (areaM2 < MIN_PARCEL_AREA_M2) {
		throw new Error("BOUNDARY_AREA_TOO_SMALL");
	}
}

export function parseParcelBoundaryJson(
	value: Prisma.JsonValue,
): ParcelBoundary {
	const parsed = parcelBoundarySchema.parse(value);
	return parsed;
}

export function parcelBoundaryToJson(
	boundary: ParcelBoundary,
): Prisma.InputJsonValue {
	return boundary as Prisma.InputJsonValue;
}

export function formatParcelAreaHa(areaM2: number): string {
	return (areaM2 / 10_000).toFixed(2);
}

export function formatParcelAreaDisplay(
	parcel: ParcelAreaFields & { boundary?: Prisma.JsonValue | null },
): string {
	const areaM2 = getParcelAreaM2(parcel);
	const ha = formatParcelAreaHa(areaM2);
	if (parcel.boundary != null) {
		return `${ha} ha (${Math.round(areaM2)} m²)`;
	}
	return `${parcel.width}m × ${parcel.height}m (${ha} ha)`;
}
