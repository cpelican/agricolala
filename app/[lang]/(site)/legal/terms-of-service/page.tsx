import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
	LegalPage,
	legalMetadata,
	legalStaticParams,
} from "@/components/legal/legal-page";
import { TosContent } from "@/components/legal/tos-content";
import { PUBLIC_PAGES } from "@/lib/site-url";
import { languageIsLocale } from "@/lib/translations-helpers";
import { tServer } from "@/lib/translations-server-only";

export const dynamicParams = false;
export const generateStaticParams = legalStaticParams;

export async function generateMetadata({
	params,
}: {
	params: Promise<{ lang: string }>;
}): Promise<Metadata> {
	const { lang } = await params;
	if (!languageIsLocale(lang)) return {};
	const { legal } = tServer(lang);

	return legalMetadata({
		locale: lang,
		page: PUBLIC_PAGES.termsOfService,
		title: legal.termsOfService,
		description: legal.meta.termsDescription,
	});
}

export default async function TermsOfServicePage({
	params,
}: {
	params: Promise<{ lang: string }>;
}) {
	const { lang } = await params;
	if (!languageIsLocale(lang)) notFound();
	const dict = tServer(lang);

	return (
		<LegalPage
			dict={dict}
			locale={lang}
			page={PUBLIC_PAGES.termsOfService}
			title={dict.legal.termsOfService}
			subtitle={dict.legal.description}
		>
			<TosContent legal={dict.legal} headingLevel="h2" />
		</LegalPage>
	);
}
