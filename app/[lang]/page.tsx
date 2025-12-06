import { StrictMode, Suspense } from "react";
import { HomeContentAsync } from "@/components/async/home-content-async";
import { requireAuth } from "@/lib/auth-utils";
import { tServer } from "@/lib/translations-server-only";
import { HomeSkeleton } from "@/components/skeletons/home-skeleton";
import { Header } from "@/components/misc/header";
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

	return (
		<StrictMode>
			<Header
				title={`${dict?.home?.welcome} ${session?.user?.name ?? session?.user?.email}!`}
			/>
			<Suspense fallback={<HomeSkeleton />}>
				<HomeContentAsync locale={locale} userId={userId} />
			</Suspense>
		</StrictMode>
	);
}
