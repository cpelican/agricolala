import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
	return {
		name: "Agricolala - Vineyard Management",
		short_name: "Agricolala",
		description: "Manage your vineyard treatments and parcels",
		start_url: "/",
		display: "standalone",
		icons: [],
		categories: ["agriculture", "productivity", "business"],
		orientation: "portrait-primary",
	};
}
