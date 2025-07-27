import { FileText } from "lucide-react";
import { AuthGuard } from "@/components/auth/auth-guard";
import { LayoutWithHeader } from "@/components/async/layout-with-header";
import { TosContent } from "@/components/legal/tos-content";
import { BackButton } from "@/components/routing/back-button";
import { tServer } from "@/lib/translations-server-only";
import { type Locale } from "@/lib/translations-helpers";

export default async function TermsOfServicePage({
	params,
}: {
	params: Promise<{ lang: Locale }>;
}) {
	const { lang } = await params;
	const dict = tServer(lang);

	return (
		<AuthGuard>
			<LayoutWithHeader
				title={dict.legal.termsOfService}
				subtitle={dict.legal.description}
				icon={<FileText />}
			>
				<div className="p-4 flex flex-col gap-2">
					<BackButton />
					<TosContent showLinks={false} />
				</div>
			</LayoutWithHeader>
		</AuthGuard>
	);
}
