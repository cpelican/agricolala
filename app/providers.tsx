"use client";

import { TosCheck } from "@/components/legal/tos-check";
import type { ReactNode } from "react";
import { TranslationsProvider } from "@/contexts/translations-context";

export function Providers({ children }: { children: ReactNode }) {
	return (
		<TranslationsProvider>
			<TosCheck>{children}</TosCheck>
		</TranslationsProvider>
	);
}
