"use client";

import { LocaleLink } from "../locale/locale-link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { localeRegex } from "@/lib/translations-helpers";
import { navigation } from "@/app/const";
import { useTranslations } from "@/contexts/translations-context";

export function BottomNavigation() {
	const pathname = usePathname();
	const { t } = useTranslations();

	return (
		<nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 safe-area-pb">
			<div className="flex justify-around">
				{navigation.map((item) => {
					const pathWithoutLocale = pathname.replace(localeRegex, "") || "/";
					const isActive = pathWithoutLocale === item.href;
					return (
						<LocaleLink
							key={item.name}
							href={item.href}
							className={cn(
								"flex flex-col items-center px-3 py-2 text-xs font-medium rounded-lg transition-colors",
								isActive
									? "text-primary-700 bg-hsl"
									: "text-gray-500 hover:text-gray-700",
							)}
						>
							<item.icon className="h-6 w-6 mb-1" />
							{t(item.name)}
						</LocaleLink>
					);
				})}
			</div>
		</nav>
	);
}
