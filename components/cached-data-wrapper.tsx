import {
	getCachedSubstances,
	getCachedDiseases,
	getCachedProducts,
	getCachedSubstanceDoses,
} from "@/lib/cached-data";
import { CachedDataProvider } from "@/contexts/cached-data-context";

interface CachedDataWrapperProps {
	children: React.ReactNode;
}

export async function CachedDataWrapper({ children }: CachedDataWrapperProps) {
	const [substances, diseases, products, substanceDoses] = await Promise.all([
		getCachedSubstances(),
		getCachedDiseases(),
		getCachedProducts(),
		getCachedSubstanceDoses(),
	]);

	return (
		<CachedDataProvider
			substances={substances}
			diseases={diseases}
			products={products}
			substanceDoses={substanceDoses}
		>
			{children}
		</CachedDataProvider>
	);
}
