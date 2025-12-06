import { Suspense } from "react";
import { TreatmentsContentAsync } from "@/components/async/treatments-content-async";
import { AddTreatmentButtonAsync } from "@/components/async/add-treatment-button-async";
import { TreatmentsSkeleton } from "@/components/skeletons/treatments-skeleton";
import { requireAuth } from "@/lib/auth-utils";
import { getTreatments } from "@/lib/data-fetcher";
import { ExcelExportDialog } from "@/components/treatments/excel-export-dialog";
import { tServer } from "@/lib/translations-server-only";
import { getLanguageAsLocale } from "@/lib/translations-helpers";
import { Header } from "@/components/misc/header";

export default async function TreatmentsPage({
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
			<Header
				title={dict.treatments.title}
				subtitle={dict.treatments.description}
			>
				<ExcelExportDialog className="top-3 right-8" />
			</Header>
			<Suspense fallback={<TreatmentsSkeleton />}>
				<TreatmentsContentAsync
					treatmentsPromise={getTreatments(session.user.id)}
				/>
			</Suspense>
			<Suspense fallback={null}>
				<AddTreatmentButtonAsync userId={session.user.id} />
			</Suspense>
		</>
	);
}
