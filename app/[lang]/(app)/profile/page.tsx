import { tServer } from "@/lib/i18n/server";
import { getLanguageAsLocale } from "@/lib/i18n/locale";
import { Suspense } from "react";
import { ProfileContentAsync } from "@/components/profile/profile-content-async";
import { ProfileSkeleton } from "@/components/profile/profile-skeleton";
import { Header } from "@/components/layout/header";

export default async function ProfilePage({
	params,
}: {
	params: Promise<{ lang: string }>;
}) {
	const { lang } = await params;
	const locale = getLanguageAsLocale(lang);
	const dict = tServer(locale);

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
