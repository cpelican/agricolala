"use client";

import L from "leaflet";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import {
	createParcelMap,
	fitMapToBounds,
	flyToLatLng,
	getInitialCenterFromParcels,
	getSafeMapCenter,
	isMapLayoutReady,
	isValidParcelCoords,
	type ParcelMapParcel,
	renderDrawingLayers,
	renderParcelLayers,
	setViewLatLng,
} from "@/components/parcels/parcel-map-leaflet";
import { useEmptyMapGeolocation } from "@/components/parcels/use-empty-map-geolocation";
import { ParcelMapLocationBanner } from "@/components/parcels/parcel-map-location-banner";
import { PARCEL_MAP_HEIGHT_PX } from "@/components/parcels/parcel-map-skeleton";
import { useTranslations } from "@/contexts/translations-context";
import type { ParcelBoundaryPoint } from "@/lib/parcel-geometry";
import {
	getDefaultMapZoom,
	getDrawModeZoom,
	getHighlightZoom,
} from "@/lib/map-tiles";
import {
	defaultUserLocation,
	isValidLatLng,
	requestUserLocation,
} from "@/lib/user-location";

export type { ParcelMapParcel } from "@/components/parcels/parcel-map-leaflet";

export interface ParcelMapProps {
	parcels: ParcelMapParcel[];
	drawing?: {
		vertices: ParcelBoundaryPoint[];
		onVertexAdd: (lat: number, lng: number) => void;
	};
	highlightParcelId?: string;
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
	// One-time fly-to on empty map; reset when parcels are added.
	const hasAutoCenteredForEmptyParcelsRef = useRef(false);
	// Set on user pan/zoom so layer re-renders do not snap back to fallback GPS.
	const hasUserAdjustedViewRef = useRef(false);
	const programmaticCameraMoveRef = useRef(false);
	const hasParcels = parcels.length > 0;
	const parcelMapCenter = useMemo(
		() => (hasParcels ? getInitialCenterFromParcels(parcels) : null),
		[hasParcels, parcels],
	);
	const [emptyMapGeo, setEmptyMapGeo] = useEmptyMapGeolocation(hasParcels);
	const [locationFailureDismissed, setLocationFailureDismissed] =
		useState(false);

	const mapReadyPoint = hasParcels ? parcelMapCenter : emptyMapGeo.point;
	const userLocation = hasParcels ? null : emptyMapGeo.point;
	const locationFailure = hasParcels ? null : emptyMapGeo.failure;
	const isLoading = hasParcels ? false : emptyMapGeo.loading;

	// Create the Leaflet map once; destroyed only if mapReadyPoint changes.
	useEffect(() => {
		if (
			typeof window === "undefined" ||
			!mapRef.current ||
			mapInstanceRef.current ||
			mapReadyPoint == null
		) {
			return;
		}

		const defaultZoom = getDefaultMapZoom();
		const initialCenter = isValidLatLng(mapReadyPoint[0], mapReadyPoint[1])
			? mapReadyPoint
			: defaultUserLocation();

		const map = createParcelMap(mapRef.current, initialCenter, defaultZoom);

		parcelLayersRef.current = L.layerGroup().addTo(map);
		drawingLayersRef.current = L.layerGroup().addTo(map);

		map.on("click", (e: L.LeafletMouseEvent) => {
			if (drawingRef.current) {
				drawingRef.current.onVertexAdd(e.latlng.lat, e.latlng.lng);
			}
		});

		// Initial setView/flyTo also fire moveend — programmatic flag avoids false positives.
		map.on("moveend", () => {
			if (!programmaticCameraMoveRef.current) {
				hasUserAdjustedViewRef.current = true;
			}
			programmaticCameraMoveRef.current = false;
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
				setViewLatLng(
					map,
					initialCenter[0],
					initialCenter[1],
					defaultZoom,
					programmaticCameraMoveRef,
				);
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
	}, [mapReadyPoint]);

	// Allow auto-center again after the first parcel is added (empty → non-empty).
	useEffect(() => {
		if (parcels.length > 0) {
			hasAutoCenteredForEmptyParcelsRef.current = false;
		}
	}, [parcels.length]);

	// Before paint so the first map tap after Draw is not lost to a stale ref.
	useLayoutEffect(() => {
		drawingRef.current = drawing;
	}, [drawing]);

	// Sync parcel layers and run initial camera (highlight, fitBounds, or GPS center).
	useEffect(() => {
		const map = mapInstanceRef.current;
		const parcelLayers = parcelLayersRef.current;
		if (!map || !parcelLayers || mapReadyPoint == null) {
			return;
		}

		let cancelled = false;

		const { boundsPoints, highlightedParcel } = renderParcelLayers(
			parcelLayers,
			parcels,
			highlightParcelId,
			userLocation,
		);

		const hasValidUserLocation =
			userLocation != null && isValidLatLng(userLocation[0], userLocation[1]);

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
					programmaticCameraMoveRef,
				);
				return;
			}

			// Preserve view after manual navigation or when entering draw mode.
			if (hasUserAdjustedViewRef.current || drawingRef.current) {
				return;
			}

			// Empty map: center once on GPS or fallback (e.g. 45°N 7°E when geo fails).
			if (
				parcels.length === 0 &&
				hasValidUserLocation &&
				!hasAutoCenteredForEmptyParcelsRef.current
			) {
				flyToLatLng(
					map,
					userLocation[0],
					userLocation[1],
					getDefaultMapZoom(),
					programmaticCameraMoveRef,
				);
				hasAutoCenteredForEmptyParcelsRef.current = true;
			} else if (
				parcels.length > 0 &&
				boundsPoints.length > 0 &&
				!highlightParcelId
			) {
				fitMapToBounds(map, boundsPoints, programmaticCameraMoveRef);
			}
		};

		map.whenReady(applyCamera);

		return () => {
			cancelled = true;
		};
		// drawing omitted: toggling draw must not re-run applyCamera (was snapping to fallback).
	}, [parcels, highlightParcelId, mapReadyPoint, userLocation]);

	// Leaflet uses grab/grabbing for pan; pointer signals tap-to-place vertices.
	useEffect(() => {
		const container = mapInstanceRef.current?.getContainer();
		if (!container) {
			return;
		}
		container.style.cursor = drawing ? "pointer" : "";
		return () => {
			container.style.cursor = "";
		};
	}, [drawing, mapReadyPoint]);

	// Draw draft boundary vertices, polyline, and closed polygon while adding a parcel.
	useEffect(() => {
		const drawingLayers = drawingLayersRef.current;
		if (drawingLayers) {
			renderDrawingLayers(drawingLayers, drawing?.vertices);
		}
	}, [drawing]);

	function handleUseMyLocation() {
		void (async () => {
			setEmptyMapGeo((prev) => ({ ...prev, loading: true }));
			const result = await requestUserLocation(true);
			if (result.ok && isValidLatLng(result.location[0], result.location[1])) {
				const location: [number, number] = [
					result.location[0],
					result.location[1],
				];
				setEmptyMapGeo({
					point: location,
					failure: null,
					loading: false,
				});
				const map = mapInstanceRef.current;
				if (map) {
					flyToLatLng(
						map,
						result.location[0],
						result.location[1],
						drawingRef.current ? getDrawModeZoom() : getDefaultMapZoom(),
						programmaticCameraMoveRef,
					);
					// Explicit user action — do not let a later applyCamera override this flyTo.
					hasUserAdjustedViewRef.current = true;
				}
			} else {
				setEmptyMapGeo((prev) => ({
					...prev,
					failure: result.ok ? "unavailable" : result.reason,
					loading: false,
				}));
				setLocationFailureDismissed(false); // show banner again after a failed retry
			}
		})();
	}

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
			{parcels.length === 0 &&
				locationFailure &&
				!isLoading &&
				!locationFailureDismissed && (
					<ParcelMapLocationBanner
						failure={locationFailure}
						onDismiss={() => setLocationFailureDismissed(true)}
						onUseMyLocation={handleUseMyLocation}
					/>
				)}
		</div>
	);
}
