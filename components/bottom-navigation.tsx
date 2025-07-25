"use client";

import { Calendar, Home, Map, User } from "lucide-react";
import { LocaleLink } from "./locale-link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useTranslations } from "@/hooks/use-translations";
import { localeRegex } from "@/lib/translations-helpers";

export function BottomNavigation() {
	const pathname = usePathname();
	const { t } = useTranslations();

	const navigation = [
		{ name: t("navigation.home"), href: "/", icon: Home },
		{ name: t("navigation.parcels"), href: "/parcels", icon: Map },
		{ name: t("navigation.treatments"), href: "/treatments", icon: Calendar },
		{ name: t("navigation.profile"), href: "/profile", icon: User },
	] as const;

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
									? "text-primary-700 bg-primary-50"
									: "text-gray-500 hover:text-gray-700",
							)}
						>
							<item.icon className="h-6 w-6 mb-1" />
							{item.name}
						</LocaleLink>
					);
				})}
			</div>
		</nav>
	);
}
