import { type TreatmentType } from "@/lib/data-fetcher";
import { TreatmentsContent } from "./treatments-content";

interface TreatmentsContentAsyncProps {
	treatmentsPromise: Promise<TreatmentType[]>;
	currentUserId: string;
}

export async function TreatmentsContentAsync({
	treatmentsPromise,
	currentUserId,
}: TreatmentsContentAsyncProps) {
	const treatments = await treatmentsPromise;
	return (
		<TreatmentsContent treatments={treatments} currentUserId={currentUserId} />
	);
}
