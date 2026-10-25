import { AddTreatmentButton } from "../treatments/add-treatment-button";
import {
	getParcels,
	getStageByParcel,
	getStageEstimatesByParcel,
} from "@/lib/data-fetcher";

interface AddTreatmentButtonAsyncProps {
	userId: string;
}

export async function AddTreatmentButtonAsync({
	userId,
}: AddTreatmentButtonAsyncProps) {
	const [parcels, stages, stageEstimates] = await Promise.all([
		getParcels(userId),
		getStageByParcel(userId),
		getStageEstimatesByParcel(userId),
	]);
	return (
		<AddTreatmentButton
			parcels={parcels}
			stages={stages}
			stageEstimates={stageEstimates}
		/>
	);
}
