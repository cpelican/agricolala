import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { AuthGuard } from "@/components/auth-guard";
import { BottomNavigation } from "@/components/bottom-navigation";
import { HomeContent } from "@/components/home-content";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { LayoutWithHeader } from "@/components/layout-with-header";

export default async function Home() {
	const session = await getServerSession(authOptions);

	if (!session) {
		redirect("/auth/signin");
	}

	const parcels = await prisma.parcel.findMany({
		where: { userId: session.user.id },
		include: {
			treatments: {
				include: {
					productApplications: {
						include: {
							product: {
								include: {
									composition: {
										include: {
											substance: true,
										},
									},
								},
							},
						},
					},
					parcel: true,
				},
				where: {
					status: "DONE",
					appliedDate: {
						gte: new Date(new Date().getFullYear(), 0, 1),
						lte: new Date(new Date().getFullYear(), 11, 31),
					},
				},
			},
		},
	});

	return (
		<AuthGuard>
			<LayoutWithHeader
				title="Agraria"
				subtitle={`Welcome back, ${session.user?.name ?? session.user?.email}`}
			>
				<HomeContent parcels={parcels} />
				<BottomNavigation />
			</LayoutWithHeader>
		</AuthGuard>
	);
}
