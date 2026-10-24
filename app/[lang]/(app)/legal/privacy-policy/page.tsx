import { PrivacyContent } from "@/components/legal/privacy-content";
import { BackButton } from "@/components/routing/back-button";
import { tServer } from "@/lib/translations-server-only";
import { getLanguageAsLocale } from "@/lib/translations-helpers";
import { Header } from "@/components/misc/header";

export default async function PrivacyPolicyPage({
	params,
}: {
	params: Promise<{ lang: string }>;
}) {
	const { lang } = await params;
	const locale = getLanguageAsLocale(lang);
	const dict = tServer(locale);

	return (
		<div className="p-4 flex flex-col gap-2">
			<Header
				title={dict.legal.privacyPolicy}
				subtitle={dict.legal.howWeHandleData}
			/>
			<BackButton />
			<PrivacyContent showLinks={false} />
		</div>
	);
}
