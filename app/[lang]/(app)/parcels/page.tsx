import { requireAuth } from "@/lib/auth-utils";
import { tServer } from "@/lib/i18n/server";
import { getLanguageAsLocale } from "@/lib/i18n/locale";
import { ParcelsContentAsync } from "@/components/parcels/parcels-content-async";
import { Suspense } from "react";
import { ParcelsSkeleton } from "@/components/parcels/parcels-skeleton";
import { Header } from "@/components/layout/header";

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
