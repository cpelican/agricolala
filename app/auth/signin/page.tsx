"use client";

import { useRouter } from "next/navigation";
import { getSession, signIn } from "next-auth/react";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	getLocaleFromBrowser,
	useTranslations,
} from "@/hooks/use-translations";

const signInWithGoogle = () => {
	signIn("google", { callbackUrl: "/" });
};

export default function SignIn() {
	const router = useRouter();
	// Here we cannot take the locale from the pathname therefore we take it from the browser
	const { t } = useTranslations(getLocaleFromBrowser());

	useEffect(() => {
		getSession().then((session) => {
			if (session) {
				router.push(`/${session.user.locale}`);
			}
		});
	}, [router]);

	return (
		<div className="min-h-screen flex items-center justify-center bg-primary-10 px-4">
			<Card className="w-full max-w-md">
				<CardHeader className="text-center">
					<CardTitle className="text-2xl font-bold text-primary-700">
						{t("auth.title")}
					</CardTitle>
					<CardDescription>{t("auth.description")}</CardDescription>
				</CardHeader>
				<CardContent>
					<Button
						onClick={signInWithGoogle}
						className="w-full bg-main-gradient hover:bg-primary-700"
						size="lg"
					>
						{t("auth.signInWithGoogle")}
					</Button>
				</CardContent>
			</Card>
		</div>
	);
}
