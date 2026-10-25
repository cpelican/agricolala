"use client";
import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import type { ComponentProps } from "react";
import { Button } from "../ui/button";

export const SignOutButton = ({
	label,
	variant = "outline",
	className = "w-full",
}: {
	label: string;
	variant?: ComponentProps<typeof Button>["variant"];
	className?: string;
}) => {
	return (
		<Button
			onClick={() => signOut({ callbackUrl: "/auth/signin" })}
			variant={variant}
			className={className}
		>
			<LogOut aria-hidden="true" className="h-4 w-4" />
			{label}
		</Button>
	);
};
