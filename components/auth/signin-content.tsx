"use client";

import { getSession, signIn } from "next-auth/react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "../ui/card";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { type TranslationType } from "@/lib/translations-server-only";
import { getLocaleFromBrowser } from "@/contexts/translations-context";
import { Button } from "../ui/button";

const signInWithGoogle = () => {
	signIn("google", { callbackUrl: "/" });
};

export const SignInContent = ({
	authDicts,
}: {
	authDicts: { en: TranslationType["auth"]; it: TranslationType["auth"] };
}) => {
	const router = useRouter();
	const lang = getLocaleFromBrowser();
	const [hasCheckedSession, setHasCheckedSession] = useState(false);

	useEffect(() => {
		async function checkSession() {
			const session = await getSession();
			if (session) {
				router.push(`/${session.user.locale}`);
			}
			setHasCheckedSession(true);
		}
		checkSession();
	}, [router]);

	if (!hasCheckedSession) {
		return null;
	}

	return (
		<div className="min-h-screen flex items-center justify-center bg-primary-10 px-4">
			<Card className="w-full max-w-md">
				<CardHeader className="text-center">
					<CardTitle className="text-2xl font-bold text-primary-700">
						{authDicts[lang].title}
					</CardTitle>
					<CardDescription>{authDicts[lang].description}</CardDescription>
				</CardHeader>
				<CardContent>
					<Button
						onClick={signInWithGoogle}
						className="w-full bg-main-gradient hover:bg-primary-700"
						size="lg"
					>
						{authDicts[lang].signInWithGoogle}
					</Button>
				</CardContent>
			</Card>
		</div>
	);
};
