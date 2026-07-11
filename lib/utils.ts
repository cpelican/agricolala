import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

// Locale-aware readable number: thousands separators, trailing zeros trimmed.
export function formatNumber(
	value: number,
	locale: string,
	maxDecimals = 0,
): string {
	return value.toLocaleString(locale, { maximumFractionDigits: maxDecimals });
}
