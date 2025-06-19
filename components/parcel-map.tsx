"use client";

import L from "leaflet";
import { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import { type Parcel } from "@prisma/client";

// Fix Leaflet default icon
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

// Highlighted parcel icon
const highlightedIcon = L.divIcon({
	className: "highlighted-parcel-marker",
	html: `<div class="w-6 h-6 bg-red-500 rounded-full border-4 border-white shadow-lg animate-pulse"></div>`,
	iconSize: [24, 24],
	iconAnchor: [12, 12],
});

L.Marker.prototype.options.icon = defaultIcon;

export interface ParcelMapProps {
	parcels: Pick<Parcel, "id" | "name" | "latitude" | "longitude">[];
	onMapClick?: (lat: number, lng: number) => void;
	highlightParcelId?: string;
}

export function ParcelMap({
	parcels,
	onMapClick,
	highlightParcelId,
}: ParcelMapProps) {
	const mapRef = useRef<HTMLDivElement>(null);
	const mapInstanceRef = useRef<L.Map | null>(null);
	const markersRef = useRef<L.Marker[]>([]);
	const [userLocation, setUserLocation] = useState<[number, number] | null>(
		null,
	);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		// Get user's current location
		if (navigator.geolocation) {
			navigator.geolocation.getCurrentPosition(
				(position) => {
					const { latitude, longitude } = position.coords;
					setUserLocation([latitude, longitude]);
					setIsLoading(false);
				},
				(error) => {
					console.error("Error getting location:", error);
					// Fallback to default location (45.0, 7.0)
					setUserLocation([45.0, 7.0]);
					setIsLoading(false);
				},
			);
		} else {
			// Fallback to default location if geolocation is not supported
			setUserLocation([45.0, 7.0]);
			setIsLoading(false);
		}
	}, []);

	useEffect(() => {
		if (typeof window === "undefined" || !mapRef.current || !userLocation)
			return;

		// Initialize map
		if (!mapInstanceRef.current) {
			mapInstanceRef.current = L.map(mapRef.current, {
				zoomControl: true,
				attributionControl: true,
				scrollWheelZoom: true,
				dragging: true,
			}).setView(userLocation, 13);

			L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
				attribution:
					'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
			}).addTo(mapInstanceRef.current);

			// Add click handler for new parcels
			mapInstanceRef.current.on("click", (e: L.LeafletMouseEvent) => {
				if (onMapClick) {
					onMapClick(e.latlng.lat, e.latlng.lng);
				}
			});

			// Add user location marker with a custom icon
			const userIcon = L.divIcon({
				className: "user-location-marker",
				html: `<div class="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg"></div>`,
			});

			L.marker(userLocation, { icon: userIcon })
				.bindPopup("Your location")
				.addTo(mapInstanceRef.current);
		}

		// Clear existing markers
		markersRef.current.forEach((marker) => marker.remove());
		markersRef.current = [];

		// Add markers for existing parcels
		parcels.forEach((parcel) => {
			const isHighlighted = highlightParcelId === parcel.id;
			const marker = L.marker([parcel.latitude, parcel.longitude], {
				icon: isHighlighted ? highlightedIcon : defaultIcon,
			})
				.bindPopup(`
          <div class="p-2">
            <h3 class="font-medium">${parcel.name}</h3>
            <p class="text-sm text-gray-600">${parcel.latitude.toFixed(4)}, ${parcel.longitude.toFixed(4)}</p>
          </div>
        `)
				.addTo(mapInstanceRef.current!);

			markersRef.current.push(marker);

			// If this is the highlighted parcel, open its popup and zoom to it
			if (isHighlighted) {
				marker.openPopup();
				mapInstanceRef.current!.setView(
					[parcel.latitude, parcel.longitude],
					15,
				);
			}
		});

		// Fit bounds to show all markers if there are any and no specific parcel is highlighted
		if (parcels.length > 0 && userLocation && !highlightParcelId) {
			const coordinates: L.LatLngExpression[] = [
				userLocation,
				...parcels.map((p) => [p.latitude, p.longitude] as [number, number]),
			];
			const bounds = L.latLngBounds(coordinates);
			mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50] });
		}

		return () => {
			if (mapInstanceRef.current) {
				mapInstanceRef.current.remove();
				mapInstanceRef.current = null;
			}
		};
	}, [parcels, onMapClick, userLocation, highlightParcelId]);

	return (
		<div className="w-full">
			<div ref={mapRef} className="w-full h-[400px] rounded-lg relative z-0" />
			{isLoading && (
				<div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
					<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
				</div>
			)}
		</div>
	);
}
