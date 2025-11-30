import { Calendar, Home, User, Map } from "lucide-react";
import { Inter } from "next/font/google";

export const Errors = {
	RESOURCE_NOT_FOUND: "Resource not found",
	UNAUTHORIZED: "Unauthorized",
	ACCESS_DENIED: "Access denied",
	INTERNAL_SERVER: "Internal server error",
};

export const INVALID_SESSION_ID = "";
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
