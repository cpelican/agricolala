import { StrictMode, Suspense } from "react";
import { HomePageContent } from "@/components/home/home-page-content";
import { requireAuth } from "@/lib/auth-utils";
import { tServer } from "@/lib/i18n/server";
import { HomeSkeleton } from "@/components/home/home-skeleton";
import { getLanguageAsLocale } from "@/lib/i18n/locale";

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
	const welcomeTitle = `${dict.home.welcome}, ${session.user.name ?? session.user.email}`;

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
					eyebrow={dict.home.eyebrow}
				/>
			</Suspense>
		</StrictMode>
	);
}
