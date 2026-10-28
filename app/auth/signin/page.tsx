import { dictionaries } from "@/lib/i18n/dictionaries";
import { getRequestLocale } from "@/lib/i18n/server";
import { SignInContent } from "@/components/auth/signin-content";

export default async function SignIn() {
	const lang = await getRequestLocale();
	const hasCredentialsProvider =
		!!process.env.TEST_USER_EMAIL &&
		!!process.env.TEST_USER_PASSWORD &&
		process.env.VERCEL_ENV !== "production";
	const hasGoogleProvider =
		!!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET;

	return (
		<SignInContent
			authDict={dictionaries[lang].auth}
			hasCredentialsProvider={hasCredentialsProvider}
			hasGoogleProvider={hasGoogleProvider}
		/>
	);
}
