import { getParcels, getStageByParcel } from "@/lib/data-fetcher";
import { ParcelsContent } from "../parcels/parcels-content";

interface ParcelsContentAsyncProps {
	userId: string;
}

export async function ParcelsContentAsync({
	userId,
}: ParcelsContentAsyncProps) {
	const [parcels, stages] = await Promise.all([
		getParcels(userId),
		getStageByParcel(userId),
	]);
	return <ParcelsContent parcels={parcels} stages={stages} />;
}
