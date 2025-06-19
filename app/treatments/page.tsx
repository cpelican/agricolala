import { AuthGuard } from "@/components/auth-guard";
import { BottomNavigation } from "@/components/bottom-navigation";
import { TreatmentsContent } from "@/components/treatments-content";
import { prisma } from "@/lib/prisma";
import { LayoutWithHeader } from "@/components/layout-with-header";
import { getCachedDiseases } from "@/lib/cached-data";
import { requireAuth } from "@/lib/auth-utils";

export default async function TreatmentsPage() {
	const session = await requireAuth();

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
	const diseases = await getCachedDiseases();
	return (
		<AuthGuard>
			<LayoutWithHeader
				title="Treatments"
				subtitle="Manage all your vineyard treatments"
			>
				<TreatmentsContent treatments={treatments} diseases={diseases} />
				<BottomNavigation />
			</LayoutWithHeader>
		</AuthGuard>
	);
}
