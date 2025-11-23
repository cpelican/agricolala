"use client";

import { TosCheck } from "@/components/legal/tos-check";
import type React from "react";
import { TranslationsProvider } from "@/contexts/translations-context";

export function Providers({
	children,
	userEmail,
}: {
	children: React.ReactNode;
	userEmail?: string | null;
}) {
	return (
		<TranslationsProvider>
			<TosCheck userEmail={userEmail}>{children}</TosCheck>
		</TranslationsProvider>
	);
}
