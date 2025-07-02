import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
	return {
		name: "Agricolala - Wineyard Management",
		short_name: "Agricolala",
		description: "Manage your wineyard treatments and parcels",
		start_url: "/",
		display: "standalone",
		icons: [],
		categories: ["agriculture", "productivity", "business"],
		orientation: "portrait-primary",
	};
}
