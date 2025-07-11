import { CachedDataProvider } from "@/contexts/cached-data-context";
import {
	getCachedDiseases,
	getCachedProducts,
	getCachedCompositions,
	getCachedSubstances,
} from "@/lib/data-fetcher";

interface CachedDataWrapperProps {
	children: React.ReactNode;
}

export async function CachedDataWrapper({ children }: CachedDataWrapperProps) {
	const [substances, diseases, products, compositions] = await Promise.all([
		getCachedSubstances(),
		getCachedDiseases(),
		getCachedProducts(),
		getCachedCompositions(),
	]);

	return (
		<CachedDataProvider
			substances={substances}
			diseases={diseases}
			products={products}
			compositions={compositions}
		>
			{children}
		</CachedDataProvider>
	);
}
