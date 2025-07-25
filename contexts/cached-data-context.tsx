"use client";

import {
	getCachedSubstances,
	getCachedDiseases,
	getCachedProducts,
	getCachedCompositions,
} from "@/lib/data-fetcher";
import { createContext, useContext, type ReactNode } from "react";

interface CachedDataContextType {
	substances: Awaited<ReturnType<typeof getCachedSubstances>>;
	diseases: Awaited<ReturnType<typeof getCachedDiseases>>;
	products: Awaited<ReturnType<typeof getCachedProducts>>;
	compositions: Awaited<ReturnType<typeof getCachedCompositions>>;
}

const CachedDataContext = createContext<CachedDataContextType | undefined>(
	undefined,
);

interface CachedDataProviderProps {
	children: ReactNode;
	substances: CachedDataContextType["substances"];
	diseases: CachedDataContextType["diseases"];
	products: CachedDataContextType["products"];
	compositions: CachedDataContextType["compositions"];
}

export function CachedDataProvider({
	children,
	substances,
	diseases,
	products,
	compositions,
}: CachedDataProviderProps) {
	return (
		<CachedDataContext.Provider
			value={{
				substances,
				diseases,
				products,
				compositions,
			}}
		>
			{children}
		</CachedDataContext.Provider>
	);
}

function useCachedData() {
	const context = useContext(CachedDataContext);
	if (context === undefined) {
		throw new Error("useCachedData must be used within a CachedDataProvider");
	}
	return context;
}

// Convenience hooks for specific data types
export function useSubstances() {
	const { substances } = useCachedData();
	return substances;
}

export function useDiseases() {
	const { diseases } = useCachedData();
	return diseases;
}

export function useProducts() {
	const { products } = useCachedData();
	return products;
}

export function useCompositions() {
	const { compositions } = useCachedData();
	return compositions;
}
