"use client";

import { SignOutButton } from "@/components/signout-button";
import {
	Card,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { useTranslations } from "@/contexts/translations-context";

export function UnauthorizedMessage() {
	const { t } = useTranslations();

	return (
		<Card className="p-4 m-4">
			<CardHeader className="text-center">
				<CardTitle>{t("home.welcome")}</CardTitle>
				<CardDescription>{t("auth.unauthorizedMessage")}</CardDescription>
			</CardHeader>
			<CardFooter>
				<SignOutButton />
			</CardFooter>
		</Card>
	);
}
