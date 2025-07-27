"use client";

import { SessionProvider } from "next-auth/react";
import { TosCheck } from "@/components/legal/tos-check";
import type React from "react";
import { TranslationsProvider } from "@/contexts/translations-context";

export function Providers({ children }: { children: React.ReactNode }) {
	return (
		<SessionProvider>
			<TranslationsProvider>
				<TosCheck>{children}</TosCheck>
			</TranslationsProvider>
		</SessionProvider>
	);
}
