import { DEFAULT_MAP_CENTER } from "@/lib/map-tiles";

export type UserLocationLatLng = readonly [lat: number, lng: number];

export type UserLocationFailureReason =
	| "insecure"
	| "unsupported"
	| "denied"
	| "unavailable"
	| "timeout";

export type UserLocationResult =
	| { ok: true; location: UserLocationLatLng }
	| { ok: false; reason: UserLocationFailureReason };

const GEO_OPTIONS: PositionOptions = {
	enableHighAccuracy: false,
	timeout: 20_000,
	maximumAge: 300_000,
};

function failureFromError(
	error: GeolocationPositionError,
): UserLocationFailureReason {
	switch (error.code) {
		case error.PERMISSION_DENIED:
			return "denied";
		case error.POSITION_UNAVAILABLE:
			return "unavailable";
		case error.TIMEOUT:
			return "timeout";
		default:
			return "unavailable";
	}
}

export function canRequestGeolocation(): boolean {
	return (
		typeof window !== "undefined" &&
		typeof navigator !== "undefined" &&
		!!navigator.geolocation &&
		window.isSecureContext
	);
}

export function defaultUserLocation(): UserLocationLatLng {
	return [DEFAULT_MAP_CENTER.lat, DEFAULT_MAP_CENTER.lng];
}

export function isValidLatLng(lat: number, lng: number): boolean {
	return (
		Number.isFinite(lat) &&
		Number.isFinite(lng) &&
		lat >= -90 &&
		lat <= 90 &&
		lng >= -180 &&
		lng <= 180
	);
}

function normalizeLatLng(lat: number, lng: number): UserLocationLatLng | null {
	return isValidLatLng(lat, lng) ? [lat, lng] : null;
}

let cachedResult: UserLocationResult | null = null;

export function clearUserLocationCache() {
	cachedResult = null;
}

export function requestUserLocation(
	force = false,
): Promise<UserLocationResult> {
	if (!force && cachedResult) {
		if (
			cachedResult.ok &&
			!isValidLatLng(cachedResult.location[0], cachedResult.location[1])
		) {
			cachedResult = { ok: false, reason: "unavailable" };
		}
		return Promise.resolve(cachedResult);
	}

	if (typeof window === "undefined" || typeof navigator === "undefined") {
		cachedResult = { ok: false, reason: "unsupported" };
		return Promise.resolve(cachedResult);
	}

	if (!navigator.geolocation) {
		cachedResult = { ok: false, reason: "unsupported" };
		return Promise.resolve(cachedResult);
	}

	if (!window.isSecureContext) {
		cachedResult = { ok: false, reason: "insecure" };
		return Promise.resolve(cachedResult);
	}

	return new Promise((resolve) => {
		navigator.geolocation.getCurrentPosition(
			(position) => {
				const location = normalizeLatLng(
					position.coords.latitude,
					position.coords.longitude,
				);
				if (location) {
					cachedResult = { ok: true, location };
				} else {
					cachedResult = { ok: false, reason: "unavailable" };
				}
				resolve(cachedResult);
			},
			(error) => {
				cachedResult = { ok: false, reason: failureFromError(error) };
				resolve(cachedResult);
			},
			GEO_OPTIONS,
		);
	});
}

export function geolocationFailureMessage(
	reason: UserLocationFailureReason,
	t: (key: string) => string,
): string {
	switch (reason) {
		case "insecure":
			return t("parcels.locationInsecureContext");
		case "denied":
			return t("parcels.locationDenied");
		case "timeout":
			return t("parcels.locationTimeout");
		case "unsupported":
			return t("parcels.locationUnsupported");
		default:
			return t("parcels.locationUnavailable");
	}
}
