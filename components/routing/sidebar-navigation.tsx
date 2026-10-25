"use client";

import { navigation } from "@/lib/app-shell";
import { LocaleLink } from "../locale/locale-link";
import { usePathname } from "next/navigation";
import { localeRegex } from "@/lib/i18n/locale";
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
							prefetch
							className={cn(
								"flex min-h-11 items-center gap-3 rounded-lg px-3 py-2 transition-colors",
								isActive
									? "bg-primary-50 font-semibold text-primary-700"
									: "font-medium text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900",
							)}
							aria-current={isActive ? "page" : undefined}
						>
							<item.icon aria-hidden="true" className="size-[22px]" />
							{t(item.name)}
						</LocaleLink>
					</li>
				);
			})}
		</ul>
	);
}
