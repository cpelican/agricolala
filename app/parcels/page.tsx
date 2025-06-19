import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { AuthGuard } from "@/components/auth-guard";
import { BottomNavigation } from "@/components/bottom-navigation";
import { ParcelsContent } from "@/components/parcels-content";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { LayoutWithHeader } from "@/components/layout-with-header";

export default async function ParcelsPage() {
	const session = await getServerSession(authOptions);

	if (!session) {
		redirect("/auth/signin");
	}

	const parcels = await prisma.parcel.findMany({
		where: { userId: session.user.id },
		orderBy: { createdAt: "desc" },
	});

	return (
		<AuthGuard>
			<LayoutWithHeader
				title="My Parcels"
				subtitle="Manage your vineyard parcels"
			>
				<ParcelsContent parcels={parcels} />
				<BottomNavigation />
			</LayoutWithHeader>
		</AuthGuard>
	);
}
