import { Shield } from "lucide-react";
import { AuthGuard } from "@/components/auth-guard";
import { LayoutWithHeader } from "@/components/layout-with-header";
import { PrivacyContent } from "@/components/privacy-content";
import { BackButton } from "@/components/back-button";
import { getDictionary } from "@/lib/dictionaries";
import { type Locale } from "@/lib/server-translations";

export default async function PrivacyPolicyPage({
	params,
}: {
	params: Promise<{ lang: Locale }>;
}) {
	const { lang } = await params;
	const dict = await getDictionary(lang);

	return (
		<AuthGuard>
			<LayoutWithHeader
				title={dict.legal.privacyPolicy}
				subtitle={dict.legal.howWeHandleData}
				icon={<Shield />}
			>
				<div className="p-4 flex flex-col gap-2">
					<BackButton />
					<PrivacyContent showLinks={false} />
				</div>
			</LayoutWithHeader>
		</AuthGuard>
	);
}
