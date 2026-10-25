import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LegalPage, legalMetadata } from "@/components/legal/legal-page";
import { PrivacyContent } from "@/components/legal/privacy-content";
import { PUBLIC_PAGES } from "@/lib/site-url";
import { languageIsLocale } from "@/lib/i18n/locale";
import { tServer } from "@/lib/i18n/server";

export const dynamicParams = false;

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
		page: PUBLIC_PAGES.privacyPolicy,
		title: legal.privacyPolicy,
		description: legal.meta.privacyDescription,
	});
}

export default async function PrivacyPolicyPage({
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
			page={PUBLIC_PAGES.privacyPolicy}
			title={dict.legal.privacyPolicy}
			subtitle={dict.legal.howWeHandleData}
		>
			<PrivacyContent legal={dict.legal} headingLevel="h2" />
		</LegalPage>
	);
}
