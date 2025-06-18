"use client";

import { Calendar, Home, Map, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navigation = [
	{ name: "Home", href: "/", icon: Home },
	{ name: "Parcels", href: "/parcels", icon: Map },
	{ name: "Treatments", href: "/treatments", icon: Calendar },
	{ name: "Profile", href: "/profile", icon: User },
];

export function BottomNavigation() {
	const pathname = usePathname();

	return (
		<nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 safe-area-pb">
			<div className="flex justify-around">
				{navigation.map((item) => {
					const isActive = pathname === item.href;
					return (
						<Link
							key={item.name}
							href={item.href}
							className={cn(
								"flex flex-col items-center px-3 py-2 text-xs font-medium rounded-lg transition-colors",
								isActive
									? "text-green-600 bg-green-50"
									: "text-gray-500 hover:text-gray-700",
							)}
						>
							<item.icon className="h-6 w-6 mb-1" />
							{item.name}
						</Link>
					);
				})}
			</div>
		</nav>
	);
}
