"use client";

import { getLocaleFromPathname } from "@/lib/server-translations";
import Link, { type LinkProps } from "next/link";
import { usePathname } from "next/navigation";

type LocaleLinkProps = {
	href: string;
	children: React.ReactNode;
	className?: string;
} & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps> &
	LinkProps;

export function LocaleLink({ href, children, ...props }: LocaleLinkProps) {
	const locale = getLocaleFromPathname(usePathname());

	return (
		<Link href={`/${locale}${href}`} {...props}>
			{children}
		</Link>
	);
}
