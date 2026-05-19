import { dictionaries } from "@/lib/translations-server-only";
import { SignInContent } from "@/components/auth/signin-content";

const authEnDicts = dictionaries.en.auth;
const authItDicts = dictionaries.it.auth;
const signinDicts = {
	en: authEnDicts,
	it: authItDicts,
};

export default async function SignIn() {
	const hasCredentialsProvider =
		!!process.env.TEST_USER_EMAIL && !!process.env.TEST_USER_PASSWORD;
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
