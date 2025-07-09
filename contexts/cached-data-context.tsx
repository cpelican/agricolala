"use client";

import {
	getCachedDiseases,
	getCachedProducts,
	getCachedSubstances,
	getCachedSubstanceDoses,
} from "@/lib/cached-data";
import { createContext, useContext, type ReactNode } from "react";

interface CachedDataContextType {
	substances: Awaited<ReturnType<typeof getCachedSubstances>>;
	diseases: Awaited<ReturnType<typeof getCachedDiseases>>;
	products: Awaited<ReturnType<typeof getCachedProducts>>;
	substanceDoses: Awaited<ReturnType<typeof getCachedSubstanceDoses>>;
}

const CachedDataContext = createContext<CachedDataContextType | undefined>(
	undefined,
);

interface CachedDataProviderProps {
	children: ReactNode;
	substances: CachedDataContextType["substances"];
	diseases: CachedDataContextType["diseases"];
	products: CachedDataContextType["products"];
	substanceDoses: CachedDataContextType["substanceDoses"];
}

export function CachedDataProvider({
	children,
	substances,
	diseases,
	products,
	substanceDoses,
}: CachedDataProviderProps) {
	return (
		<CachedDataContext.Provider
			value={{
				substances,
				diseases,
				products,
				substanceDoses,
			}}
		>
			{children}
		</CachedDataContext.Provider>
	);
}

export function useCachedData() {
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

export function useSubstanceDoses() {
	const { substanceDoses } = useCachedData();
	return substanceDoses;
}
