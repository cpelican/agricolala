import { getParcels, type ParcelWithTreatments } from "@/lib/parcel-helpers";

interface ParcelsDataProviderProps {
	userId: string;
	children: (parcels: ParcelWithTreatments[]) => React.ReactNode;
}

export async function ParcelsDataProvider({
	userId,
	children,
}: ParcelsDataProviderProps) {
	const parcels = await getParcels(userId);
	return <>{children(parcels)}</>;
}
