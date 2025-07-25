import { User } from "lucide-react";
import { AuthGuard } from "@/components/auth-guard";

import { LayoutWithHeader } from "@/components/layout-with-header";
import { requireAuth } from "@/lib/auth-utils";
import { BottomNavigation } from "@/components/bottom-navigation";
import { getTosStatus } from "../../actions/get-tos-status";
import { ProfileContent } from "@/components/profile-content";
import { getDictionary } from "@/lib/dictionaries";
import { type Locale } from "@/lib/server-translations";

export default async function ProfilePage({
	params,
}: {
	params: Promise<{ lang: Locale }>;
}) {
	const { lang } = await params;
	const dict = await getDictionary(lang);
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
				<BottomNavigation />
			</LayoutWithHeader>
		</AuthGuard>
	);
}
