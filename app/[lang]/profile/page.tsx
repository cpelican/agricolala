import { tServer } from "@/lib/translations-server-only";
import { type Locale } from "@/lib/translations-helpers";
import { Suspense } from "react";
import { ProfileContentAsync } from "@/components/async/profile-content-async";
import { ProfileSkeleton } from "@/components/skeletons/profile-skeleton";
import { Header } from "@/components/misc/header";

export default async function ProfilePage({
	params,
}: {
	params: Promise<{ lang: Locale }>;
}) {
	const { lang } = await params;
	const dict = tServer(lang);

	return (
		<>
			<Header
				title={dict.profile.title}
				subtitle={dict.profile.accountSettings}
			/>
			<Suspense fallback={<ProfileSkeleton />}>
				<ProfileContentAsync />
			</Suspense>
		</>
	);
}
