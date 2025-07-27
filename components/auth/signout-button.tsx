"use client";
import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import { Button } from "../ui/button";

export const SignOutButton = () => {
	return (
		<Button
			onClick={() => signOut({ callbackUrl: "/auth/signin" })}
			variant="destructive"
			className="w-full"
		>
			<LogOut className="h-4 w-4 mr-2" />
			Sign Out
		</Button>
	);
};
