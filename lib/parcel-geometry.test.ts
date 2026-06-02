import { describe, expect, it } from "vitest";
import {
	computeParcelAreaM2,
	computeParcelCentroid,
	getParcelAreaM2,
	validateBoundary,
} from "./parcel-geometry";

/** ~100m × 100m square near 44°N, 9°E (approximate geodesic area) */
const square100m: { lat: number; lng: number }[] = [
	{ lat: 44.0, lng: 9.0 },
	{ lat: 44.0, lng: 9.00135 },
	{ lat: 43.9991, lng: 9.00135 },
	{ lat: 43.9991, lng: 9.0 },
];

describe("parcel-geometry", () => {
	it("computes area for a roughly 100×100 m square", () => {
		const areaM2 = computeParcelAreaM2(square100m);
		expect(areaM2).toBeGreaterThan(8_000);
		expect(areaM2).toBeLessThan(12_000);
	});

	it("computes centroid inside the polygon", () => {
		const center = computeParcelCentroid(square100m);
		expect(center.lat).toBeGreaterThan(43.998);
		expect(center.lat).toBeLessThan(44.001);
		expect(center.lng).toBeGreaterThan(8.999);
		expect(center.lng).toBeLessThan(9.002);
	});

	it("getParcelAreaM2 prefers areaM2 when set", () => {
		expect(getParcelAreaM2({ areaM2: 500, width: 10, height: 10 })).toBe(500);
	});

	it("getParcelAreaM2 falls back to width × height", () => {
		expect(getParcelAreaM2({ areaM2: null, width: 20, height: 30 })).toBe(600);
	});

	it("validateBoundary rejects self-intersecting polygons", () => {
		const bowtie = [
			{ lat: 44.0, lng: 9.0 },
			{ lat: 44.001, lng: 9.001 },
			{ lat: 44.001, lng: 9.0 },
			{ lat: 44.0, lng: 9.001 },
		];
		expect(() => validateBoundary(bowtie)).toThrow("INVALID_BOUNDARY_SHAPE");
	});

	it("validateBoundary accepts a simple square", () => {
		expect(() => validateBoundary(square100m)).not.toThrow();
	});
});
