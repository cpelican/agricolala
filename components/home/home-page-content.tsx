import { Suspense } from "react";
import { HomeDashboardContent } from "@/components/home/home-dashboard-content";
import { Header } from "@/components/layout/header";
import { HomeContentUI } from "@/components/home/home-content-ui";
import { HomeDashboardBodySkeleton } from "@/components/home/home-skeleton";
import { getParcels } from "@/lib/data-fetcher";
import { type Locale } from "@/lib/i18n/locale";

interface HomePageContentProps {
	userId: string;
	welcomeTitle: string;
	eyebrow: string;
	locale: Locale;
}

export async function HomePageContent({
	userId,
	welcomeTitle,
	eyebrow,
	locale,
}: HomePageContentProps) {
	const parcels = await getParcels(userId);
	const hasParcels = parcels.length > 0;

	return (
		<>
			<Header eyebrow={eyebrow} title={welcomeTitle} />
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
