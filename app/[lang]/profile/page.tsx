import { User } from "lucide-react";
import { AuthGuard } from "@/components/auth-guard";

import { LayoutWithHeader } from "@/components/layout-with-header";
import { requireAuth } from "@/lib/auth-utils";
import { getTosStatus } from "../../actions/get-tos-status";
import { ProfileContent } from "@/components/profile-content";
import { tServer } from "@/lib/translations-server-only";
import { type Locale } from "@/lib/translations-helpers";

export default async function ProfilePage({
	params,
}: {
	params: Promise<{ lang: Locale }>;
}) {
	const { lang } = await params;
	const dict = await tServer(lang);
	const session = await requireAuth();
	const tosStatus = await getTosStatus();

	return (
		<AuthGuard>
			<LayoutWithHeader
				title={dict.profile.title}
				subtitle={dict.profile.accountSettings}
				icon={<User />}
			>
				<ProfileContent
					user={{
						name: session.user?.name || "",
						email: session.user?.email || "",
						image: session.user?.image || "",
					}}
					tosStatus={tosStatus}
				/>
			</LayoutWithHeader>
		</AuthGuard>
	);
}
