import { AddTreatmentButton } from "../treatments/add-treatment-button";
import { getParcels, getStageByParcel } from "@/lib/data-fetcher";

interface AddTreatmentButtonAsyncProps {
	userId: string;
}

export async function AddTreatmentButtonAsync({
	userId,
}: AddTreatmentButtonAsyncProps) {
	const [parcels, stages] = await Promise.all([
		getParcels(userId),
		getStageByParcel(userId),
	]);
	return <AddTreatmentButton parcels={parcels} stages={stages} />;
}
