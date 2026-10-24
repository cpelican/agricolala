import { StrictMode, Suspense } from "react";
import { HomePageContent } from "@/components/async/home-page-content";
import { requireAuth } from "@/lib/auth-utils";
import { tServer } from "@/lib/translations-server-only";
import { HomeSkeleton } from "@/components/skeletons/home-skeleton";
import { getLanguageAsLocale } from "@/lib/translations-helpers";

export default async function Home({
	params,
}: {
	params: Promise<{ lang: string }>;
}) {
	const { lang } = await params;
	const locale = getLanguageAsLocale(lang);
	const dict = tServer(locale);
	const session = await requireAuth();
	const userId = session.user.id;
	const welcomeTitle = `${dict?.home?.welcome} ${session?.user?.name ?? session?.user?.email}!`;

	return (
		<StrictMode>
			<Suspense
				fallback={
					<HomeSkeleton ariaLabel={dict.home.loading} variant="empty" />
				}
			>
				<HomePageContent
					locale={locale}
					userId={userId}
					welcomeTitle={welcomeTitle}
				/>
			</Suspense>
		</StrictMode>
	);
}
