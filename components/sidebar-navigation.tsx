"use client";

import { navigation } from "@/app/const";
import { LocaleLink } from "./locale-link";
import { usePathname } from "next/navigation";
import { localeRegex } from "@/lib/translations-helpers";
import { cn } from "@/lib/utils";
import { useTranslations } from "@/contexts/translations-context";

export function SidebarNavigation() {
	const pathname = usePathname();
	const { t } = useTranslations();

	return (
		<ul>
			{navigation.map((item) => {
				const pathWithoutLocale = pathname.replace(localeRegex, "") || "/";
				const isActive = pathWithoutLocale === item.href;
				return (
					<li key={item.name}>
						<LocaleLink
							href={item.href}
							className={cn(
								`flex items-center gap-3 px-3 py-2 rounded-md transition-colors`,
								isActive
									? "text-primary-700 bg-primary-50"
									: "text-gray-500 hover:text-gray-700",
							)}
						>
							<item.icon className="h-6 w-6 mb-1" />
							{t(item.name)}
						</LocaleLink>
					</li>
				);
			})}
		</ul>
	);
}
