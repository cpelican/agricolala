import { AuthGuard } from "@/components/auth-guard";
import { ParcelsContent } from "@/components/parcels-content";
import { LayoutWithHeader } from "@/components/layout-with-header";
import { requireAuth } from "@/lib/auth-utils";
import { Map } from "lucide-react";
import { getParcels } from "@/lib/data-fetcher";
import { CachedDataWrapper } from "@/components/cached-data-wrapper";
import { tServer } from "@/lib/translations-server-only";
import { type Locale } from "@/lib/translations-helpers";

export default async function ParcelsPage({
	params,
}: {
	params: Promise<{ lang: Locale }>;
}) {
	const { lang } = await params;
	const dict = await tServer(lang);
	const session = await requireAuth();
	const parcels = await getParcels(session.user.id);

	return (
		<AuthGuard>
			<CachedDataWrapper>
				<LayoutWithHeader
					title={dict.parcels.title}
					subtitle={dict.parcels.description}
					icon={<Map />}
				>
					<ParcelsContent parcels={parcels} />
				</LayoutWithHeader>
			</CachedDataWrapper>
		</AuthGuard>
	);
}
