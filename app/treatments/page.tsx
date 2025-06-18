import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { AuthGuard } from "@/components/auth-guard";
import { BottomNavigation } from "@/components/bottom-navigation";
import { TreatmentsContent } from "@/components/treatments-content";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function TreatmentsPage() {
	const session = await getServerSession(authOptions);

	if (!session?.user?.id) {
		redirect("/auth/signin");
	}

	const treatments = await prisma.treatment.findMany({
		where: { userId: session.user.id },
		include: {
			parcel: true,
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
		},
		orderBy: [{ status: "asc" }, { dateMin: "asc" }],
	});

	return (
		<AuthGuard>
			<div className="min-h-screen bg-gray-50 pb-20">
				<div className="bg-green-600 text-white p-4">
					<h1 className="text-2xl font-bold">Treatments</h1>
					<p className="text-green-100">Manage all your vineyard treatments</p>
				</div>

				<TreatmentsContent treatments={treatments} />
				<BottomNavigation />
			</div>
		</AuthGuard>
	);
}
