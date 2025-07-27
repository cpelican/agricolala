import { type TreatmentType } from "@/lib/data-fetcher";
import { TreatmentsContent } from "./treatments-content";

interface TreatmentsContentAsyncProps {
	treatmentsPromise: Promise<TreatmentType[]>;
}

export async function TreatmentsContentAsync({
	treatmentsPromise,
}: TreatmentsContentAsyncProps) {
	const treatments = await treatmentsPromise;
	return <TreatmentsContent treatments={treatments} />;
}
