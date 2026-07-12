"use client";

import { TosCheck } from "@/components/legal/tos-check";
import type { ReactNode } from "react";
import { TranslationsProvider } from "@/contexts/translations-context";
import { Toaster } from "@/components/ui/toaster";

export function Providers({ children }: { children: ReactNode }) {
	return (
		<TranslationsProvider>
			<TosCheck>{children}</TosCheck>
			<Toaster />
		</TranslationsProvider>
	);
}
