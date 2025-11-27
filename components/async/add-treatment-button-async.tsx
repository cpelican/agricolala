import { AddTreatmentButton } from "../treatments/add-treatment-button";
import { getParcels } from "@/lib/data-fetcher";

interface AddTreatmentButtonAsyncProps {
	userId: string;
}

export async function AddTreatmentButtonAsync({
	userId,
}: AddTreatmentButtonAsyncProps) {
	const parcels = await getParcels(userId);
	return <AddTreatmentButton parcels={parcels} />;
}
