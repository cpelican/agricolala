import { Shield } from "lucide-react";
import { AuthGuard } from "@/components/auth/auth-guard";
import { LayoutWithHeader } from "@/components/async/layout-with-header";
import { PrivacyContent } from "@/components/legal/privacy-content";
import { BackButton } from "@/components/routing/back-button";
import { tServer } from "@/lib/translations-server-only";
import { type Locale } from "@/lib/translations-helpers";

export default async function PrivacyPolicyPage({
	params,
}: {
	params: Promise<{ lang: Locale }>;
}) {
	const { lang } = await params;
	const dict = tServer(lang);

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
