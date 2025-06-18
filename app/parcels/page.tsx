import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { AuthGuard } from "@/components/auth-guard";
import { BottomNavigation } from "@/components/bottom-navigation";
import { ParcelsContent } from "@/components/parcels-content";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
			<div className="min-h-screen bg-gray-50 pb-20">
				<div className="bg-green-600 text-white p-4">
					<h1 className="text-2xl font-bold">My Parcels</h1>
					<p className="text-green-100">Manage your vineyard parcels</p>
				</div>

				<ParcelsContent parcels={parcels} />
				<BottomNavigation />
			</div>
		</AuthGuard>
	);
}
