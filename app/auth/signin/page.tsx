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

export default function SignIn() {
	const router = useRouter();

	useEffect(() => {
		getSession().then((session) => {
			if (session) {
				router.push("/");
			}
		});
	}, [router]);

	return (
		<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-green-100 px-4">
			<Card className="w-full max-w-md">
				<CardHeader className="text-center">
					<CardTitle className="text-2xl font-bold text-green-700">
						Agricolala
					</CardTitle>
					<CardDescription>
						Manage your vineyard treatments and parcels
					</CardDescription>
				</CardHeader>
				<CardContent>
					<Button
						onClick={() => signIn("google", { callbackUrl: "/" })}
						className="w-full bg-green-600 hover:bg-green-700"
						size="lg"
					>
						Sign in with Google
					</Button>
				</CardContent>
			</Card>
		</div>
	);
}
