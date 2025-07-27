import { TosContent } from "@/components/legal/tos-content";
import { BackButton } from "@/components/routing/back-button";
import { tServer } from "@/lib/translations-server-only";
import { type Locale } from "@/lib/translations-helpers";
import { Header } from "@/components/misc/header";

export default async function TermsOfServicePage({
	params,
}: {
	params: Promise<{ lang: Locale }>;
}) {
	const { lang } = await params;
	const dict = tServer(lang);

	return (
		<div className="p-4 flex flex-col gap-2">
			<Header
				title={dict.legal.termsOfService}
				subtitle={dict.legal.description}
			/>
			<BackButton />
			<TosContent showLinks={false} />
		</div>
	);
}
