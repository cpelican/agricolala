import { dictionaries } from "@/lib/translations-server-only";
import { SignInContent } from "@/components/signin-content";

const authEnDicts = dictionaries.en.auth;
const authItDicts = dictionaries.it.auth;
const signinDicts = {
	en: authEnDicts,
	it: authItDicts,
};

export default async function SignIn() {
	return <SignInContent authDicts={signinDicts} />;
}
