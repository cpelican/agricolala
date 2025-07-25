import { User } from "lucide-react";
import { AuthGuard } from "@/components/auth-guard";

import { LayoutWithHeader } from "@/components/layout-with-header";
import { requireAuth } from "@/lib/auth-utils";
import { BottomNavigation } from "@/components/bottom-navigation";
import { getTosStatus } from "../actions/get-tos-status";
import { ProfileContent } from "@/components/profile-content";

export default async function ProfilePage() {
	const session = await requireAuth();
	const tosStatus = await getTosStatus();

	return (
		<AuthGuard>
			<LayoutWithHeader
				title="Profile"
				subtitle="Manage your account settings"
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
