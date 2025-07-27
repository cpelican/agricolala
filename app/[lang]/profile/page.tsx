import { User } from "lucide-react";
import { AuthGuard } from "@/components/auth/auth-guard";
import { LayoutWithHeader } from "@/components/async/layout-with-header";
import { tServer } from "@/lib/translations-server-only";
import { type Locale } from "@/lib/translations-helpers";
import { Suspense } from "react";
import { ProfileContentAsync } from "@/components/async/profile-content-async";
import { ProfileSkeleton } from "@/components/skeletons/profile-skeleton";

export default async function ProfilePage({
	params,
}: {
	params: Promise<{ lang: Locale }>;
}) {
	const { lang } = await params;
	const dict = tServer(lang);

	return (
		<AuthGuard>
			<LayoutWithHeader
				title={dict.profile.title}
				subtitle={dict.profile.accountSettings}
				icon={<User />}
			>
				<Suspense fallback={<ProfileSkeleton />}>
					<ProfileContentAsync />
				</Suspense>
			</LayoutWithHeader>
		</AuthGuard>
	);
}
