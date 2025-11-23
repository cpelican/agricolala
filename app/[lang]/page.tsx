import { StrictMode, Suspense } from "react";
import { HomeContentAsync } from "@/components/async/home-content-async";
import { requireAuth } from "@/lib/auth-utils";
import { tServer } from "@/lib/translations-server-only";
import { type Locale } from "@/lib/translations-helpers";
import { getParcels } from "@/lib/data-fetcher";
import { HomeSkeleton } from "@/components/skeletons/home-skeleton";
import { Header } from "@/components/misc/header";

// routes being rendered for each user at request time. This option is equivalent to no caching.
export const dynamic = "force-dynamic";

export default async function Home({
	params,
}: {
	params: Promise<{ lang: Locale }>;
}) {
	const { lang } = await params;
	const dict = tServer(lang);
	const session = await requireAuth();
	const userId = session.user.id;

	return (
		<StrictMode>
			<Header
				title={`${dict?.home?.welcome} ${session?.user?.name ?? session?.user?.email}!`}
			/>
			<Suspense fallback={<HomeSkeleton />}>
				<HomeContentAsync
					parcelsPromise={getParcels(userId)}
					locale={lang}
					userId={userId}
				/>
			</Suspense>
		</StrictMode>
	);
}
