import { AddTreatmentButton } from "../treatments/add-treatment-button";
import { type ParcelWithTreatments } from "@/lib/data-fetcher";

interface AddTreatmentButtonAsyncProps {
	parcelsPromise: Promise<ParcelWithTreatments[]>;
}

export async function AddTreatmentButtonAsync({
	parcelsPromise,
}: AddTreatmentButtonAsyncProps) {
	const parcels = await parcelsPromise;
	return <AddTreatmentButton parcels={parcels} />;
}
