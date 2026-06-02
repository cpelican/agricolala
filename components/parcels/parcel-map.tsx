"use client";

import L from "leaflet";
import { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import type { Prisma } from "@prisma/client";
import { PARCEL_MAP_HEIGHT_PX } from "@/components/parcels/parcel-map-skeleton";
import { useTranslations } from "@/contexts/translations-context";
import {
	type ParcelBoundaryPoint,
	parseParcelBoundaryJson,
} from "@/lib/parcel-geometry";

const defaultIcon = L.icon({
	iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
	iconRetinaUrl:
		"https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
	shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
	iconSize: [25, 41],
	iconAnchor: [12, 41],
	popupAnchor: [1, -34],
	shadowSize: [41, 41],
});

const highlightedIcon = L.divIcon({
	className: "highlighted-parcel-marker",
	html: `<div class="w-6 h-6 bg-red-500 rounded-full border-4 border-white shadow-lg animate-pulse"></div>`,
	iconSize: [24, 24],
	iconAnchor: [12, 12],
});

const vertexIcon = L.divIcon({
	className: "parcel-draw-vertex",
	html: `<div class="w-3 h-3 bg-emerald-600 rounded-full border-2 border-white shadow"></div>`,
	iconSize: [12, 12],
	iconAnchor: [6, 6],
});

L.Marker.prototype.options.icon = defaultIcon;

const DEFAULT_LOCATION = { lat: 45.0, lng: 7.0 } as const;

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
	const [userLocation, setUserLocation] = useState<[number, number]>([
		DEFAULT_LOCATION.lat,
		DEFAULT_LOCATION.lng,
	]);
	const [isLoading, setIsLoading] = useState(
		typeof navigator !== "undefined" && !!navigator.geolocation,
	);

	useEffect(() => {
		drawingRef.current = drawing;
	}, [drawing]);

	useEffect(() => {
		if (!navigator.geolocation) {
			return;
		}

		navigator.geolocation.getCurrentPosition(
			(position) => {
				const { latitude, longitude } = position.coords;
				setUserLocation([
					latitude ?? DEFAULT_LOCATION.lat,
					longitude ?? DEFAULT_LOCATION.lng,
				]);
				setIsLoading(false);
			},
			(error) => {
				console.warn("Error getting location:", error);
				setIsLoading(false);
			},
		);
	}, []);

	useEffect(() => {
		if (
			typeof window === "undefined" ||
			!mapRef.current ||
			mapInstanceRef.current
		) {
			return;
		}

		const map = L.map(mapRef.current, {
			zoomControl: true,
			attributionControl: true,
			scrollWheelZoom: true,
			dragging: true,
		}).setView([DEFAULT_LOCATION.lat, DEFAULT_LOCATION.lng], 13);

		L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
			attribution:
				'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
		}).addTo(map);

		parcelLayersRef.current = L.layerGroup().addTo(map);
		drawingLayersRef.current = L.layerGroup().addTo(map);

		map.on("click", (e: L.LeafletMouseEvent) => {
			if (drawingRef.current) {
				drawingRef.current.onVertexAdd(e.latlng.lat, e.latlng.lng);
			}
		});

		mapInstanceRef.current = map;

		return () => {
			map.remove();
			mapInstanceRef.current = null;
			parcelLayersRef.current = null;
			drawingLayersRef.current = null;
		};
	}, []);

	useEffect(() => {
		mapInstanceRef.current?.setView(
			userLocation,
			mapInstanceRef.current.getZoom(),
		);
	}, [userLocation]);

	useEffect(() => {
		const map = mapInstanceRef.current;
		const parcelLayers = parcelLayersRef.current;
		if (!map || !parcelLayers) {
			return;
		}

		parcelLayers.clearLayers();
		const boundsPoints: L.LatLngExpression[] = [];

		for (const parcel of parcels) {
			const boundary = getParcelBoundary(parcel);
			const isHighlighted = highlightParcelId === parcel.id;

			if (boundary && boundary.length >= 3) {
				const latLngs = boundary.map((p) => [p.lat, p.lng] as L.LatLngTuple);
				L.polygon(latLngs, {
					...PARCEL_POLYGON_STYLE,
					...(isHighlighted ? { color: "#dc2626", fillColor: "#ef4444" } : {}),
				})
					.bindPopup(
						`<div class="p-2"><h3 class="font-medium">${parcel.name}</h3></div>`,
					)
					.addTo(parcelLayers);
				latLngs.forEach((ll) => boundsPoints.push(ll));
			}

			const marker = L.marker([parcel.latitude, parcel.longitude], {
				icon: isHighlighted ? highlightedIcon : defaultIcon,
			})
				.bindPopup(
					`<div class="p-2"><h3 class="font-medium">${parcel.name}</h3><p class="text-sm text-gray-600">${parcel.latitude.toFixed(4)}, ${parcel.longitude.toFixed(4)}</p></div>`,
				)
				.addTo(parcelLayers);

			boundsPoints.push([parcel.latitude, parcel.longitude]);

			if (isHighlighted) {
				marker.openPopup();
				map.setView([parcel.latitude, parcel.longitude], 15);
			}
		}

		if (parcels.length === 0) {
			const userIcon = L.divIcon({
				className: "user-location-marker",
				html: `<div class="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg"></div>`,
			});
			L.marker(userLocation, { icon: userIcon })
				.bindPopup("Your location")
				.addTo(parcelLayers);
			boundsPoints.push(userLocation);
		}

		if (boundsPoints.length > 0 && !highlightParcelId) {
			map.fitBounds(L.latLngBounds(boundsPoints), { padding: [50, 50] });
		}
	}, [parcels, highlightParcelId, userLocation]);

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
		</div>
	);
}
