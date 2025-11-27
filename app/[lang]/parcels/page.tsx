import { requireAuth } from "@/lib/auth-utils";
import { tServer } from "@/lib/translations-server-only";
import { type Locale } from "@/lib/translations-helpers";
import { ParcelsContentAsync } from "@/components/async/parcels-content-async";
import { Suspense } from "react";
import { ParcelsSkeleton } from "@/components/skeletons/parcels-skeleton";
import { Header } from "@/components/misc/header";

export default async function ParcelsPage({
	params,
}: {
	params: Promise<{ lang: Locale }>;
}) {
	const { lang } = await params;
	const dict = tServer(lang);
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
