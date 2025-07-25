"use client";

import {
	appLanguages,
	getLocaleFromPathname,
	type Locale,
	localeRegex,
} from "@/lib/translations-helpers";
import { useTranslations } from "@/hooks/use-translations";
import { useRouter, usePathname } from "next/navigation";
import { updateUserLocale } from "@/lib/actions";

export function LanguageSwitcher() {
	const router = useRouter();
	const pathname = usePathname();
	const currentLocale = getLocaleFromPathname(pathname);
	const { t } = useTranslations();

	const redirectToLocale = (locale: Locale) => {
		const newPath = pathname.replace(localeRegex, `/${locale}`);
		router.push(newPath);
	};

	const changeLanguage = async (newLocale: Locale) => {
		try {
			await updateUserLocale(newLocale);
			redirectToLocale(newLocale);
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
		} catch (_error) {
			console.error("Error updating locale");
			// Still navigate even if database update fails
			redirectToLocale(newLocale);
		}
	};

	return (
		<select
			value={currentLocale}
			onChange={(e) => changeLanguage(e.target.value as Locale)}
			className="px-3 py-2 border rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
		>
			{Object.values(appLanguages).map((locale) => (
				<option key={locale} value={locale}>
					{t(`profile.${locale}`)}
				</option>
			))}
		</select>
	);
}
