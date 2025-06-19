import { AuthGuard } from "@/components/auth-guard";
import { BottomNavigation } from "@/components/bottom-navigation";
import { HomeContent } from "@/components/home-content";
import { LayoutWithHeader } from "@/components/layout-with-header";
import { requireAuth } from "@/lib/auth-utils";
import { getParcels } from "@/lib/parcel-helpers";

export default async function Home() {
	const session = await requireAuth();
	const parcels = await getParcels(session.user.id);

	return (
		<AuthGuard>
			<LayoutWithHeader
				title="Agricolala"
				subtitle={`Welcome back, ${session?.user?.name ?? session?.user?.email}`}
			>
				<HomeContent parcels={parcels} />
				<BottomNavigation />
			</LayoutWithHeader>
		</AuthGuard>
	);
}
