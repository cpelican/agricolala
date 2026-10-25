"use client";

import { LocaleLink } from "../locale/locale-link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { localeRegex } from "@/lib/translations-helpers";
import { navigation } from "@/lib/app-shell";
import { useTranslations } from "@/contexts/translations-context";

export function BottomNavigation() {
	const pathname = usePathname();
	const { t } = useTranslations();

	return (
		<nav className="fixed right-0 bottom-0 left-0 border-t border-border bg-white px-3 pt-2 pb-3 safe-area-pb">
			<div className="grid grid-cols-4 gap-1">
				{navigation.map((item) => {
					const pathWithoutLocale = pathname.replace(localeRegex, "") || "/";
					const isActive = pathWithoutLocale === item.href;
					return (
						<LocaleLink
							key={item.name}
							href={item.href}
							prefetch
							className={cn(
								"flex min-h-[52px] flex-col items-center justify-center gap-1 rounded-lg text-xs leading-4 transition-colors",
								isActive
									? "bg-primary-50 font-semibold text-primary-700"
									: "font-medium text-neutral-600 hover:text-neutral-900",
							)}
							aria-current={isActive ? "page" : undefined}
						>
							<item.icon aria-hidden="true" className="size-[22px]" />
							{t(item.name)}
						</LocaleLink>
					);
				})}
			</div>
		</nav>
	);
}
