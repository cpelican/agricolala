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

interface SignInContentProps {
	authDicts: { en: TranslationType["auth"]; it: TranslationType["auth"] };
	hasCredentialsProvider?: boolean;
	hasGoogleProvider?: boolean;
}

export const SignInContent = ({
	authDicts,
	hasCredentialsProvider = false,
	hasGoogleProvider = true,
}: SignInContentProps) => {
	const router = useRouter();
	const lang = getLocaleFromBrowser();
	const [hasCheckedSession, setHasCheckedSession] = useState(false);
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState("");

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

	const handleCredentialsSignIn = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading(true);
		setError("");
		const result = await signIn("credentials", {
			email,
			password,
			redirect: false,
			callbackUrl: "/",
		});
		if (result?.error) {
			setError("Invalid credentials");
			setIsLoading(false);
		} else if (result?.ok) {
			router.push("/");
		}
	};

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
				<CardContent className="space-y-4">
					{hasGoogleProvider && (
						<Button
							onClick={signInWithGoogle}
							className="w-full bg-main-gradient hover:bg-primary-700"
							size="lg"
						>
							{authDicts[lang].signInWithGoogle}
						</Button>
					)}
					{hasCredentialsProvider && hasGoogleProvider && (
						<div className="relative">
							<div className="absolute inset-0 flex items-center">
								<span className="w-full border-t" />
							</div>
							<div className="relative flex justify-center text-xs uppercase">
								<span className="bg-background px-2 text-muted-foreground">
									or
								</span>
							</div>
						</div>
					)}
					{hasCredentialsProvider && (
						<form onSubmit={handleCredentialsSignIn} className="space-y-3">
							<input
								type="email"
								placeholder="Email"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								className="w-full rounded-md border px-3 py-2 text-sm"
								required
							/>
							<input
								type="password"
								placeholder="Password"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								className="w-full rounded-md border px-3 py-2 text-sm"
								required
							/>
							{error && <p className="text-sm text-red-600">{error}</p>}
							<Button
								type="submit"
								className="w-full"
								size="lg"
								disabled={isLoading}
							>
								{isLoading ? "Signing in..." : "Sign in with credentials"}
							</Button>
						</form>
					)}
				</CardContent>
			</Card>
		</div>
	);
};
