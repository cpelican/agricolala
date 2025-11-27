import { getParcels } from "@/lib/data-fetcher";
import { ParcelsContent } from "../parcels/parcels-content";

interface ParcelsContentAsyncProps {
	userId: string;
}

export async function ParcelsContentAsync({
	userId,
}: ParcelsContentAsyncProps) {
	const parcels = await getParcels(userId);
	return <ParcelsContent parcels={parcels} />;
}
