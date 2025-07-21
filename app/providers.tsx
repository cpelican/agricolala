"use client";

import { SessionProvider } from "next-auth/react";
import { TosCheck } from "@/components/tos-check";
import type React from "react";

export function Providers({ children }: { children: React.ReactNode }) {
	return (
		<SessionProvider>
			<TosCheck>{children}</TosCheck>
		</SessionProvider>
	);
}
