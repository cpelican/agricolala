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
import { MAIN_COLOR } from "@/app/const";

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
		<div className="min-h-screen flex items-center justify-center bg-linear-to-br from-green-50 to-green-100 px-4">
			<Card className="w-full max-w-md">
				<CardHeader className="text-center">
					<CardTitle className="text-2xl font-bold text-green-700">
						Agricolala
					</CardTitle>
					<CardDescription>
						Manage your wineyard treatments and parcels
					</CardDescription>
				</CardHeader>
				<CardContent>
					<Button
						onClick={() => signIn("google", { callbackUrl: "/" })}
						style={{ background: MAIN_COLOR }}
						className="w-full hover:bg-green-700"
						size="lg"
					>
						Sign in with Google
					</Button>
				</CardContent>
			</Card>
		</div>
	);
}
