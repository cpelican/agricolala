import { Calendar, Home, User, Map } from "lucide-react";
import { Inter } from "next/font/google";

export const navigation = [
	{ name: "navigation.home", href: "/", icon: Home },
	{ name: "navigation.parcels", href: "/parcels", icon: Map },
	{ name: "navigation.treatments", href: "/treatments", icon: Calendar },
	{ name: "navigation.profile", href: "/profile", icon: User },
] as const;

export const inter = Inter({
	subsets: ["latin"],
	display: "swap",
	preload: true,
	adjustFontFallback: true,
});
