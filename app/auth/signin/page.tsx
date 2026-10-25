import { dictionaries } from "@/lib/i18n/dictionaries";
import { SignInContent } from "@/components/auth/signin-content";

const signinDicts = {
	en: dictionaries.en.auth,
	it: dictionaries.it.auth,
	fr: dictionaries.fr.auth,
};

export default async function SignIn() {
	const hasCredentialsProvider =
		!!process.env.TEST_USER_EMAIL &&
		!!process.env.TEST_USER_PASSWORD &&
		process.env.VERCEL_ENV !== "production";
	const hasGoogleProvider =
		!!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET;

	return (
		<SignInContent
			authDicts={signinDicts}
			hasCredentialsProvider={hasCredentialsProvider}
			hasGoogleProvider={hasGoogleProvider}
		/>
	);
}
