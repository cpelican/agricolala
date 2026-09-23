import { Suspense } from "react";
import { HomeDashboardContent } from "@/components/async/home-dashboard-content";
import { Header } from "@/components/misc/header";
import { HomeContentUI } from "@/components/misc/home-content-ui";
import { HomeDashboardBodySkeleton } from "@/components/skeletons/home-skeleton";
import { getParcels } from "@/lib/data-fetcher";
import { type Locale } from "@/lib/translations-helpers";

interface HomePageContentProps {
	userId: string;
	welcomeTitle: string;
	locale: Locale;
}

export async function HomePageContent({
	userId,
	welcomeTitle,
	locale,
}: HomePageContentProps) {
	const parcels = await getParcels(userId);
	const hasParcels = parcels.length > 0;

	return (
		<>
			<Header title={welcomeTitle} />
			{hasParcels ? (
				<Suspense fallback={<HomeDashboardBodySkeleton />}>
					<HomeDashboardContent locale={locale} userId={userId} />
				</Suspense>
			) : (
				<HomeContentUI />
			)}
		</>
	);
}
