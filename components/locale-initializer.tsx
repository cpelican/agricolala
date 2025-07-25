"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { languageIsLocale } from "@/lib/server-translations";

export function LocaleInitializer() {
	const { data: session, status } = useSession();
	const user = session?.user;

	useEffect(() => {
		if (status === "authenticated" && user) {
			const detectedLocale = localStorage.getItem("detectedLocale");

			if (detectedLocale && languageIsLocale(detectedLocale)) {
				console.info("detectedLocale", detectedLocale);
				// setInitialUserLocale(detectedLocale)
				//   .then(() => {
				//     localStorage.removeItem('detectedLocale');
				//   })
				//   .catch(console.error);
			} else {
				// For existing users, ensure they have the cookie set
				// This handles cases where users existed before we added cookie functionality
				// We'll set a default cookie and let the server action handle the actual locale
				document.cookie = `user-locale=en; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
			}
		}
	}, [status, user]);

	return null;
}
