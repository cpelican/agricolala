import { AuthGuard } from "@/components/auth-guard";
import { CachedDataWrapper } from "@/components/cached-data-wrapper";
import { HomeContent } from "@/components/home-content";
import { LayoutWithHeader } from "@/components/layout-with-header";
import { requireAuth } from "@/lib/auth-utils";
import { getParcels } from "@/lib/data-fetcher";
import { Grape } from "lucide-react";
import { getDictionary } from "@/lib/dictionaries";
import { type Locale } from "@/lib/server-translations";

export default async function Home({
	params,
}: {
	params: Promise<{ lang: Locale }>;
}) {
	const { lang } = await params;
	const dict = await getDictionary(lang);
	const session = await requireAuth();
	const parcels = await getParcels(session.user.id);

	return (
		<AuthGuard>
			<CachedDataWrapper>
				<LayoutWithHeader
					title="Agricolala"
					subtitle={`${dict.home.welcome}, ${session?.user?.name ?? session?.user?.email}`}
					icon={<Grape className="w-8 h-8" />}
				>
					<HomeContent parcels={parcels} locale={lang} />
				</LayoutWithHeader>
			</CachedDataWrapper>
		</AuthGuard>
	);
}
