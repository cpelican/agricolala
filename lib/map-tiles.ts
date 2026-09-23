export const DEFAULT_MAP_CENTER = { lat: 45, lng: 7 } as const;
export const MIN_MAP_ZOOM = 10;
export const FIT_BOUNDS_PADDING: [number, number] = [50, 50];

export const MAP_FLY_DURATION =
	process.env.NEXT_PUBLIC_PLAYWRIGHT === "1" ? 0 : 0.6;

const ESRI_SATELLITE_TILES =
	"https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";

export interface SatelliteTileConfig {
	url: string;
	attribution: string;
	/** Highest zoom the user can reach (= native satellite tile max for this provider). */
	maxZoom: number;
}

export function getSatelliteTileConfig(): SatelliteTileConfig {
	const mapTilerKey = process.env.NEXT_PUBLIC_MAPTILER_KEY;
	if (mapTilerKey) {
		return {
			url: `https://api.maptiler.com/tiles/satellite-v2/{z}/{x}/{y}.jpg?key=${mapTilerKey}`,
			attribution: "© MapTiler © OpenStreetMap contributors",
			maxZoom: 22,
		};
	}

	return {
		url: ESRI_SATELLITE_TILES,
		attribution: "Tiles © Esri",
		maxZoom: 19,
	};
}

/** Default / list view: one step below native max so users can still zoom in once. */
export function getDefaultMapZoom(): number {
	const { maxZoom } = getSatelliteTileConfig();
	return Math.max(MIN_MAP_ZOOM, maxZoom - 1);
}

/** Parcel detail highlight: native satellite max. */
export function getHighlightZoom(): number {
	return getSatelliteTileConfig().maxZoom;
}

/** Highest practical draw zoom for the active tile provider. */
export function getDrawModeZoom(): number {
	return getSatelliteTileConfig().maxZoom;
}
