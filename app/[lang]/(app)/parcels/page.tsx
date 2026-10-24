import { requireAuth } from "@/lib/auth-utils";
import { tServer } from "@/lib/translations-server-only";
import { getLanguageAsLocale } from "@/lib/translations-helpers";
import { ParcelsContentAsync } from "@/components/async/parcels-content-async";
import { Suspense } from "react";
import { ParcelsSkeleton } from "@/components/skeletons/parcels-skeleton";
import { Header } from "@/components/misc/header";

export default async function ParcelsPage({
	params,
}: {
	params: Promise<{ lang: string }>;
}) {
	const { lang } = await params;
	const locale = getLanguageAsLocale(lang);
	const dict = tServer(locale);
	const session = await requireAuth();

	return (
		<>
			<Header title={dict.parcels.title} subtitle={dict.parcels.description} />
			<Suspense fallback={<ParcelsSkeleton />}>
				<ParcelsContentAsync userId={session.user.id} />
			</Suspense>
		</>
	);
}
