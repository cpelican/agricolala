import { getParcels } from "@/lib/parcel-helpers";
import { type ParcelWithTreatments } from "@/components/types";

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
