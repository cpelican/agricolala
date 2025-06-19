import { getParcels } from "@/lib/parcel-helpers";
import { type ParcelWithTreatments } from "@/components/types";
import { LayoutWithHeader } from "@/components/layout-with-header";
import { BottomNavigation } from "@/components/bottom-navigation";
import { AuthGuard } from "@/components/auth-guard";

interface LayoutWithParcelsProps {
	children: (parcels: ParcelWithTreatments[]) => React.ReactNode;
	title: string;
	subtitle: string;
	userId: string;
}

export async function LayoutWithParcels({
	children,
	title,
	subtitle,
	userId,
}: LayoutWithParcelsProps) {
	const parcels = await getParcels(userId);

	return (
		<AuthGuard>
			<LayoutWithHeader title={title} subtitle={subtitle}>
				{children(parcels)}
				<BottomNavigation />
			</LayoutWithHeader>
		</AuthGuard>
	);
}
