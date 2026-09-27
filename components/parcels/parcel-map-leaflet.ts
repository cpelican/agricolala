import L from "leaflet";
import type { Prisma } from "@prisma/client";
import {
	type ParcelBoundaryPoint,
	parseParcelBoundaryJson,
} from "@/lib/parcel-geometry";
import {
	FIT_BOUNDS_PADDING,
	getDefaultMapZoom,
	getSatelliteTileConfig,
	MAP_FLY_DURATION,
	MIN_MAP_ZOOM,
} from "@/lib/map-tiles";
import { defaultUserLocation, isValidLatLng } from "@/lib/user-location";

const vertexIcon = L.divIcon({
	className: "parcel-draw-vertex",
	html: `<div class="w-3 h-3 bg-emerald-600 rounded-full border-2 border-white shadow"></div>`,
	iconSize: [12, 12],
	iconAnchor: [6, 6],
});

const highlightedIcon = L.divIcon({
	className: "highlighted-parcel-marker",
	html: `<div class="w-6 h-6 bg-red-500 rounded-full border-4 border-white shadow-lg animate-pulse"></div>`,
	iconSize: [24, 24],
	iconAnchor: [12, 12],
});

const parcelMarkerIcon = L.divIcon({
	className: "parcel-centroid-marker",
	html: `<div class="w-3 h-3 bg-blue-500 rounded-full border-2 border-white shadow"></div>`,
	iconSize: [12, 12],
	iconAnchor: [6, 6],
});

const userLocationIcon = L.divIcon({
	className: "user-location-marker",
	html: `<div class="w-4 h-4 bg-sky-500 rounded-full border-2 border-white shadow-lg"></div>`,
	iconSize: [16, 16],
	iconAnchor: [8, 8],
});

const PARCEL_POLYGON_STYLE: L.PolylineOptions = {
	color: "#16a34a",
	fillColor: "#22c55e",
	fillOpacity: 0.25,
	weight: 2,
};

const DRAFT_POLYGON_STYLE: L.PolylineOptions = {
	color: "#2563eb",
	fillColor: "#3b82f6",
	fillOpacity: 0.2,
	weight: 2,
	dashArray: "6 4",
};

export interface ParcelMapParcel {
	id: string;
	name: string;
	latitude: number;
	longitude: number;
	boundary?: Prisma.JsonValue | null;
}

export function getParcelBoundary(
	parcel: ParcelMapParcel,
): ParcelBoundaryPoint[] | null {
	if (parcel.boundary == null) {
		return null;
	}
	try {
		return parseParcelBoundaryJson(parcel.boundary);
	} catch {
		return null;
	}
}

export function isMapLayoutReady(map: L.Map): boolean {
	const container = map.getContainer();
	return container.offsetWidth > 0 && container.offsetHeight > 0;
}

export function getSafeMapCenter(map: L.Map): L.LatLng | null {
	try {
		const center = map.getCenter();
		return isValidLatLng(center.lat, center.lng) ? center : null;
	} catch {
		return null;
	}
}

// Leaflet moveend cannot tell user pans from our flyTo/fitBounds — flag programmatic moves.
export type BooleanRef = { current: boolean };

export function setViewLatLng(
	map: L.Map,
	lat: number,
	lng: number,
	zoom: number,
	programmaticMoveRef?: BooleanRef,
) {
	if (programmaticMoveRef) {
		programmaticMoveRef.current = true;
	}
	map.setView([lat, lng], zoom, { animate: false });
}

export function flyToLatLng(
	map: L.Map,
	lat: number,
	lng: number,
	zoom: number,
	programmaticMoveRef?: BooleanRef,
) {
	if (!isValidLatLng(lat, lng) || !Number.isFinite(zoom)) {
		return;
	}

	map.invalidateSize();

	if (!isMapLayoutReady(map)) {
		return;
	}

	if (programmaticMoveRef) {
		programmaticMoveRef.current = true;
	}

	const safeCenter = getSafeMapCenter(map);
	const shouldAnimate = MAP_FLY_DURATION > 0 && safeCenter != null;

	if (!shouldAnimate) {
		map.setView([lat, lng], zoom, { animate: false });
		return;
	}

	try {
		map.flyTo([lat, lng], zoom, {
			animate: true,
			duration: MAP_FLY_DURATION,
		});
	} catch {
		map.setView([lat, lng], zoom, { animate: false });
	}
}

export function isValidParcelCoords(parcel: ParcelMapParcel): boolean {
	return isValidLatLng(parcel.latitude, parcel.longitude);
}

export function getInitialCenterFromParcels(
	parcels: ParcelMapParcel[],
): [number, number] {
	const valid = parcels.filter(isValidParcelCoords);
	if (valid.length === 0) {
		const fallback = defaultUserLocation();
		return [fallback[0], fallback[1]];
	}
	if (valid.length === 1) {
		return [valid[0].latitude, valid[0].longitude];
	}
	const bounds = L.latLngBounds(
		valid.map((p) => [p.latitude, p.longitude] as L.LatLngTuple),
	);
	const center = bounds.getCenter();
	return [center.lat, center.lng];
}

// Renders parcel polygons/markers (and the user location on an empty map) into the layer group.
export function renderParcelLayers(
	parcelLayers: L.LayerGroup,
	parcels: ParcelMapParcel[],
	highlightParcelId: string | undefined,
	userLocation: [number, number] | null,
): {
	boundsPoints: L.LatLngExpression[];
	highlightedParcel: ParcelMapParcel | null;
} {
	parcelLayers.clearLayers();
	const boundsPoints: L.LatLngExpression[] = [];
	let highlightedParcel: ParcelMapParcel | null = null;

	for (const parcel of parcels) {
		if (!isValidParcelCoords(parcel)) {
			continue;
		}

		const boundary = getParcelBoundary(parcel);
		const isHighlighted = highlightParcelId === parcel.id;

		if (boundary && boundary.length >= 3) {
			const latLngs = boundary
				.filter((p) => isValidLatLng(p.lat, p.lng))
				.map((p) => [p.lat, p.lng] as L.LatLngTuple);
			if (latLngs.length < 3) {
				continue;
			}
			L.polygon(latLngs, {
				...PARCEL_POLYGON_STYLE,
				...(isHighlighted ? { color: "#dc2626", fillColor: "#ef4444" } : {}),
			})
				.bindPopup(
					`<div class="p-2"><h3 class="font-medium">${parcel.name}</h3></div>`,
				)
				.addTo(parcelLayers);
			for (const ll of latLngs) {
				boundsPoints.push(ll);
			}
		}

		const marker = L.marker([parcel.latitude, parcel.longitude], {
			icon: isHighlighted ? highlightedIcon : parcelMarkerIcon,
		})
			.bindPopup(
				`<div class="p-2"><h3 class="font-medium">${parcel.name}</h3><p class="text-sm text-gray-600">${parcel.latitude.toFixed(4)}, ${parcel.longitude.toFixed(4)}</p></div>`,
			)
			.addTo(parcelLayers);

		boundsPoints.push([parcel.latitude, parcel.longitude]);

		if (isHighlighted) {
			highlightedParcel = parcel;
			marker.openPopup();
		}
	}

	if (
		parcels.length === 0 &&
		userLocation != null &&
		isValidLatLng(userLocation[0], userLocation[1])
	) {
		L.marker(userLocation, { icon: userLocationIcon })
			.bindPopup("Your location")
			.addTo(parcelLayers);
		boundsPoints.push(userLocation);
	}

	return { boundsPoints, highlightedParcel };
}

// Draws draft boundary vertices, polyline, and closed polygon while adding a parcel.
export function renderDrawingLayers(
	drawingLayers: L.LayerGroup,
	vertices: ParcelBoundaryPoint[] | undefined,
) {
	drawingLayers.clearLayers();

	if (!vertices || vertices.length === 0) {
		return;
	}

	const latLngs = vertices.map((p) => [p.lat, p.lng] as L.LatLngTuple);

	for (const point of vertices) {
		L.marker([point.lat, point.lng], { icon: vertexIcon }).addTo(drawingLayers);
	}

	if (vertices.length >= 2) {
		L.polyline(latLngs, { color: "#2563eb", weight: 2 }).addTo(drawingLayers);
	}

	if (vertices.length >= 3) {
		L.polygon(latLngs, DRAFT_POLYGON_STYLE).addTo(drawingLayers);
	}
}

export function createParcelMap(
	container: HTMLElement,
	center: readonly [number, number],
	zoom: number,
): L.Map {
	const tileConfig = getSatelliteTileConfig();
	const map = L.map(container, {
		center: [center[0], center[1]],
		zoom,
		zoomControl: true,
		attributionControl: true,
		scrollWheelZoom: true,
		dragging: true,
		minZoom: MIN_MAP_ZOOM,
		maxZoom: tileConfig.maxZoom,
	});

	L.tileLayer(tileConfig.url, {
		attribution: tileConfig.attribution,
		maxZoom: tileConfig.maxZoom,
		maxNativeZoom: tileConfig.maxZoom,
	}).addTo(map);

	return map;
}

// fitBounds needs real parcel bounds; a lone fallback marker would hijack the view.
export function fitMapToBounds(
	map: L.Map,
	boundsPoints: L.LatLngExpression[],
	programmaticMoveRef: BooleanRef,
) {
	const bounds = L.latLngBounds(boundsPoints);
	if (!bounds.isValid()) {
		return;
	}
	try {
		programmaticMoveRef.current = true;
		map.fitBounds(bounds, {
			padding: FIT_BOUNDS_PADDING,
			maxZoom: getDefaultMapZoom(),
			animate: MAP_FLY_DURATION > 0,
			duration: MAP_FLY_DURATION,
		});
	} catch {
		const center = bounds.getCenter();
		if (isValidLatLng(center.lat, center.lng)) {
			setViewLatLng(
				map,
				center.lat,
				center.lng,
				getDefaultMapZoom(),
				programmaticMoveRef,
			);
		}
	}
}
