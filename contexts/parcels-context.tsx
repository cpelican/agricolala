"use client";

import { Errors } from "@/lib/constants";
import { type ParcelWithTreatments } from "@/lib/data-fetcher";
import { createContext, useContext, type ReactNode, useState } from "react";

interface ParcelsContextType {
	parcels: ParcelWithTreatments[];
	loading: boolean;
	error: string | null;
	refreshParcels: () => Promise<void>;
}

const ParcelsContext = createContext<ParcelsContextType | undefined>(undefined);

interface ParcelsProviderProps {
	children: ReactNode;
	initialParcels: ParcelWithTreatments[];
}

export function ParcelsProvider({
	children,
	initialParcels,
}: ParcelsProviderProps) {
	const [parcels, setParcels] =
		useState<ParcelWithTreatments[]>(initialParcels);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const refreshParcels = async () => {
		setLoading(true);
		setError(null);
		try {
			const response = await fetch("/api/parcels");
			if (!response.ok) {
				throw new Error(Errors.RESOURCE_NOT_FOUND);
			}
			const data = await response.json();
			setParcels(data);
		} catch (err) {
			setError(err instanceof Error ? err.message : Errors.RESOURCE_NOT_FOUND);
		} finally {
			setLoading(false);
		}
	};

	return (
		<ParcelsContext.Provider
			value={{ parcels, loading, error, refreshParcels }}
		>
			{children}
		</ParcelsContext.Provider>
	);
}

export function useParcels() {
	const context = useContext(ParcelsContext);
	if (context === undefined) {
		throw new Error("useParcels must be used within a ParcelsProvider");
	}
	return context;
}
