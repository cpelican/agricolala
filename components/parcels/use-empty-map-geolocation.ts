"use client";

import { useEffect, useState } from "react";
import {
	defaultUserLocation,
	isValidLatLng,
	requestUserLocation,
	type UserLocationFailureReason,
} from "@/lib/user-location";

export function useEmptyMapGeolocation(hasParcels: boolean) {
	const [emptyMapGeo, setEmptyMapGeo] = useState<{
		point: [number, number] | null;
		failure: UserLocationFailureReason | null;
		loading: boolean;
	}>({ point: null, failure: null, loading: true });

	// Geolocation only when the map is empty; with parcels the map centers on them.
	useEffect(() => {
		if (hasParcels) {
			return;
		}

		let cancelled = false;

		void (async () => {
			const result = await requestUserLocation(false);
			if (cancelled) {
				return;
			}

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
			} else {
				const fallback = defaultUserLocation();
				setEmptyMapGeo({
					point: [fallback[0], fallback[1]],
					failure: result.ok ? "unavailable" : result.reason,
					loading: false,
				});
			}
		})();

		return () => {
			cancelled = true;
		};
	}, [hasParcels]);

	return [emptyMapGeo, setEmptyMapGeo] as const;
}
