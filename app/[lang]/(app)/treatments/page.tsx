import { Suspense } from "react";
import { TreatmentsContentAsync } from "@/components/treatments/treatments-content-async";
import { AddTreatmentButtonAsync } from "@/components/treatments/add-treatment-button-async";
import { TreatmentsSkeleton } from "@/components/treatments/treatments-skeleton";
import { requireAuth } from "@/lib/auth-utils";
import { getTreatments } from "@/lib/data-fetcher";
import { ExcelExportDialog } from "@/components/treatments/excel-export-dialog";
import { tServer } from "@/lib/i18n/server";
import { getLanguageAsLocale } from "@/lib/i18n/locale";
import { Header } from "@/components/layout/header";

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
				eyebrow={dict.treatments.eyebrow.replace(
					"{year}",
					String(new Date().getFullYear()),
				)}
				title={dict.treatments.title}
				subtitle={dict.treatments.description}
			>
				<ExcelExportDialog />
			</Header>
			<Suspense fallback={<TreatmentsSkeleton />}>
				<TreatmentsContentAsync
					treatmentsPromise={getTreatments(session.user.id)}
					currentUserId={session.user.id}
				/>
			</Suspense>
			<Suspense fallback={null}>
				<AddTreatmentButtonAsync userId={session.user.id} />
			</Suspense>
		</>
	);
}
