"use client";

import L from "leaflet";
import { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import type { Prisma } from "@prisma/client";
import { PARCEL_MAP_HEIGHT_PX } from "@/components/parcels/parcel-map-skeleton";
import { Button } from "@/components/ui/button";
import { useTranslations } from "@/contexts/translations-context";
import {
	type ParcelBoundaryPoint,
	parseParcelBoundaryJson,
} from "@/lib/parcel-geometry";
import {
	FIT_BOUNDS_PADDING,
	getDefaultMapZoom,
	getDrawModeZoom,
	getHighlightZoom,
	getSatelliteTileConfig,
	MAP_FLY_DURATION,
	MIN_MAP_ZOOM,
} from "@/lib/map-tiles";
import {
	canRequestGeolocation,
	defaultUserLocation,
	geolocationFailureMessage,
	isValidLatLng,
	requestUserLocation,
	type UserLocationFailureReason,
} from "@/lib/user-location";

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

export interface ParcelMapProps {
	parcels: ParcelMapParcel[];
	drawing?: {
		vertices: ParcelBoundaryPoint[];
		onVertexAdd: (lat: number, lng: number) => void;
	};
	highlightParcelId?: string;
}

function getParcelBoundary(
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

function isMapLayoutReady(map: L.Map): boolean {
	const container = map.getContainer();
	return container.offsetWidth > 0 && container.offsetHeight > 0;
}

function getSafeMapCenter(map: L.Map): L.LatLng | null {
	try {
		const center = map.getCenter();
		return isValidLatLng(center.lat, center.lng) ? center : null;
	} catch {
		return null;
	}
}

function setViewLatLng(map: L.Map, lat: number, lng: number, zoom: number) {
	map.setView([lat, lng], zoom, { animate: false });
}

function flyToLatLng(map: L.Map, lat: number, lng: number, zoom: number) {
	if (!isValidLatLng(lat, lng) || !Number.isFinite(zoom)) {
		return;
	}

	map.invalidateSize();

	if (!isMapLayoutReady(map)) {
		return;
	}

	const safeCenter = getSafeMapCenter(map);
	const shouldAnimate = MAP_FLY_DURATION > 0 && safeCenter != null;

	if (!shouldAnimate) {
		setViewLatLng(map, lat, lng, zoom);
		return;
	}

	try {
		map.flyTo([lat, lng], zoom, {
			animate: true,
			duration: MAP_FLY_DURATION,
		});
	} catch {
		setViewLatLng(map, lat, lng, zoom);
	}
}

function isValidParcelCoords(parcel: ParcelMapParcel): boolean {
	return isValidLatLng(parcel.latitude, parcel.longitude);
}

export function ParcelMap({
	parcels,
	drawing,
	highlightParcelId,
}: ParcelMapProps) {
	const { t } = useTranslations();
	const mapRef = useRef<HTMLDivElement>(null);
	const mapInstanceRef = useRef<L.Map | null>(null);
	const parcelLayersRef = useRef<L.LayerGroup | null>(null);
	const drawingLayersRef = useRef<L.LayerGroup | null>(null);
	const drawingRef = useRef(drawing);
	const hasAutoCenteredForEmptyParcelsRef = useRef(false);
	const [userLocation, setUserLocation] = useState<[number, number] | null>(
		null,
	);
	const [locationFailure, setLocationFailure] =
		useState<UserLocationFailureReason | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		drawingRef.current = drawing;
	}, [drawing]);

	useEffect(() => {
		let cancelled = false;

		void (async () => {
			setIsLoading(true);
			const result = await requestUserLocation(false);
			if (cancelled) {
				return;
			}

			if (result.ok && isValidLatLng(result.location[0], result.location[1])) {
				setUserLocation([result.location[0], result.location[1]]);
				setLocationFailure(null);
			} else {
				const fallback = defaultUserLocation();
				setUserLocation([fallback[0], fallback[1]]);
				setLocationFailure(result.ok ? "unavailable" : result.reason);
			}
			setIsLoading(false);
		})();

		return () => {
			cancelled = true;
		};
	}, []);

	function handleUseMyLocation() {
		void (async () => {
			setIsLoading(true);
			const result = await requestUserLocation(true);
			if (result.ok && isValidLatLng(result.location[0], result.location[1])) {
				setUserLocation([result.location[0], result.location[1]]);
				setLocationFailure(null);
				const map = mapInstanceRef.current;
				if (map) {
					flyToLatLng(
						map,
						result.location[0],
						result.location[1],
						drawingRef.current ? getDrawModeZoom() : getDefaultMapZoom(),
					);
				}
			} else {
				setLocationFailure(result.ok ? "unavailable" : result.reason);
			}
			setIsLoading(false);
		})();
	}

	useEffect(() => {
		if (
			typeof window === "undefined" ||
			!mapRef.current ||
			mapInstanceRef.current ||
			userLocation == null
		) {
			return;
		}

		const tileConfig = getSatelliteTileConfig();
		const defaultZoom = getDefaultMapZoom();
		const initialCenter = isValidLatLng(userLocation[0], userLocation[1])
			? userLocation
			: defaultUserLocation();

		const map = L.map(mapRef.current, {
			center: [initialCenter[0], initialCenter[1]],
			zoom: defaultZoom,
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

		parcelLayersRef.current = L.layerGroup().addTo(map);
		drawingLayersRef.current = L.layerGroup().addTo(map);

		map.on("click", (e: L.LeafletMouseEvent) => {
			if (drawingRef.current) {
				drawingRef.current.onVertexAdd(e.latlng.lat, e.latlng.lng);
			}
		});

		mapInstanceRef.current = map;

		let initCancelled = false;
		const ensureInitialView = () => {
			if (initCancelled || mapInstanceRef.current !== map) {
				return;
			}
			if (!isMapLayoutReady(map)) {
				requestAnimationFrame(ensureInitialView);
				return;
			}
			map.invalidateSize();
			if (!getSafeMapCenter(map)) {
				setViewLatLng(map, initialCenter[0], initialCenter[1], defaultZoom);
			}
		};
		requestAnimationFrame(ensureInitialView);

		return () => {
			initCancelled = true;
			map.remove();
			mapInstanceRef.current = null;
			parcelLayersRef.current = null;
			drawingLayersRef.current = null;
		};
	}, [userLocation]);

	useEffect(() => {
		if (parcels.length > 0) {
			hasAutoCenteredForEmptyParcelsRef.current = false;
		}
	}, [parcels.length]);

	useEffect(() => {
		const map = mapInstanceRef.current;
		const parcelLayers = parcelLayersRef.current;
		if (!map || !parcelLayers || userLocation == null) {
			return;
		}

		let cancelled = false;

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

		const hasValidUserLocation = isValidLatLng(
			userLocation[0],
			userLocation[1],
		);

		if (parcels.length === 0 && hasValidUserLocation) {
			L.marker(userLocation, { icon: userLocationIcon })
				.bindPopup("Your location")
				.addTo(parcelLayers);
			boundsPoints.push(userLocation);
		}

		const applyCamera = () => {
			if (
				cancelled ||
				mapInstanceRef.current !== map ||
				!isMapLayoutReady(map)
			) {
				if (!cancelled && mapInstanceRef.current === map) {
					requestAnimationFrame(applyCamera);
				}
				return;
			}

			if (highlightedParcel && isValidParcelCoords(highlightedParcel)) {
				flyToLatLng(
					map,
					highlightedParcel.latitude,
					highlightedParcel.longitude,
					getHighlightZoom(),
				);
			} else if (
				parcels.length === 0 &&
				!drawing &&
				hasValidUserLocation &&
				!hasAutoCenteredForEmptyParcelsRef.current
			) {
				flyToLatLng(map, userLocation[0], userLocation[1], getDefaultMapZoom());
				hasAutoCenteredForEmptyParcelsRef.current = true;
			} else if (boundsPoints.length > 0 && !highlightParcelId && !drawing) {
				const bounds = L.latLngBounds(boundsPoints);
				if (bounds.isValid()) {
					try {
						map.fitBounds(bounds, {
							padding: FIT_BOUNDS_PADDING,
							maxZoom: getDefaultMapZoom(),
							animate: MAP_FLY_DURATION > 0,
							duration: MAP_FLY_DURATION,
						});
					} catch {
						const center = bounds.getCenter();
						if (isValidLatLng(center.lat, center.lng)) {
							setViewLatLng(map, center.lat, center.lng, getDefaultMapZoom());
						}
					}
				}
			}
		};

		map.whenReady(applyCamera);

		return () => {
			cancelled = true;
		};
	}, [parcels, highlightParcelId, userLocation, drawing]);

	useEffect(() => {
		const drawingLayers = drawingLayersRef.current;
		if (!drawingLayers) {
			return;
		}

		drawingLayers.clearLayers();

		if (!drawing || drawing.vertices.length === 0) {
			return;
		}

		const latLngs = drawing.vertices.map(
			(p) => [p.lat, p.lng] as L.LatLngTuple,
		);

		for (const point of drawing.vertices) {
			L.marker([point.lat, point.lng], { icon: vertexIcon }).addTo(
				drawingLayers,
			);
		}

		if (drawing.vertices.length >= 2) {
			L.polyline(latLngs, { color: "#2563eb", weight: 2 }).addTo(drawingLayers);
		}

		if (drawing.vertices.length >= 3) {
			L.polygon(latLngs, DRAFT_POLYGON_STYLE).addTo(drawingLayers);
		}
	}, [drawing]);

	return (
		<div
			className="relative w-full"
			style={{ height: PARCEL_MAP_HEIGHT_PX, minHeight: PARCEL_MAP_HEIGHT_PX }}
		>
			<div
				ref={mapRef}
				role="application"
				aria-label={t("parcels.locationMap")}
				tabIndex={0}
				className="relative z-0 h-full w-full rounded-lg"
			/>
			{isLoading && (
				<div className="absolute inset-0 flex items-center justify-center rounded-lg bg-white/80 z-10">
					<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
				</div>
			)}
			{locationFailure && !isLoading && (
				<div className="absolute top-2 left-2 right-2 z-[1000] flex flex-col gap-2 rounded-lg border bg-background/95 p-3 shadow-md">
					<p className="text-sm text-muted-foreground">
						{geolocationFailureMessage(locationFailure, t)}
					</p>
					{canRequestGeolocation() && (
						<Button
							type="button"
							variant="outline"
							size="sm"
							className="self-start"
							onClick={handleUseMyLocation}
						>
							{t("parcels.useMyLocation")}
						</Button>
					)}
				</div>
			)}
		</div>
	);
}
