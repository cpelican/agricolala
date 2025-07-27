import { type ParcelWithTreatments } from "@/lib/data-fetcher";
import { ParcelsContent } from "../parcels-content";

interface ParcelsContentAsyncProps {
	parcelsPromise: Promise<ParcelWithTreatments[]>;
}

export async function ParcelsContentAsync({
	parcelsPromise,
}: ParcelsContentAsyncProps) {
	const parcels = await parcelsPromise;
	return <ParcelsContent parcels={parcels} />;
}
