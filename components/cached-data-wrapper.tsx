import {
	getCachedSubstances,
	getCachedDiseases,
	getCachedProducts,
} from "@/lib/cached-data";
import { CachedDataProvider } from "@/contexts/cached-data-context";

interface CachedDataWrapperProps {
	children: React.ReactNode;
}

export async function CachedDataWrapper({ children }: CachedDataWrapperProps) {
	const [substances, diseases, products] = await Promise.all([
		getCachedSubstances(),
		getCachedDiseases(),
		getCachedProducts(),
	]);

	return (
		<CachedDataProvider
			substances={substances}
			diseases={diseases}
			products={products}
		>
			{children}
		</CachedDataProvider>
	);
}
