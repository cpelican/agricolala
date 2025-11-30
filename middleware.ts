import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import { match } from "@formatjs/intl-localematcher";
import Negotiator from "negotiator";
import {
	defaultLocale,
	appLanguages,
	type Locale,
	localeRegex,
	getLocaleFromPathname,
	LOCALE_HEADER,
	languageIsLocale,
} from "@/lib/translations-helpers";

const locales: Locale[] = Object.values(appLanguages);

const ROUTES_WITHOUT_LOCALE = ["/admin", "/api"];
const PUBLIC_ROUTES = ["/auth", "/api/auth", "/api/health", "/api/cron"];

function getLocaleFromHeaders(request: Request): Locale {
	const headers = {
		"accept-language": request.headers.get("accept-language") || "",
	};
	const languages = new Negotiator({ headers }).languages();
	const matchedLocale = match(languages, locales, defaultLocale);

	if (!languageIsLocale(matchedLocale)) {
		return defaultLocale;
	}

	return matchedLocale;
}

export default withAuth(
	function middleware(req) {
		const { pathname } = req.nextUrl;
		const token = req.nextauth.token;

		// [cp] Route doesn't need locale prefix
		// Example: /admin, /api/health, /api/auth/callback
		// Action: Use default locale (these routes don't use i18n)
		const needsLocalePrefix = !ROUTES_WITHOUT_LOCALE.some((route) =>
			pathname.startsWith(route),
		);
		if (!needsLocalePrefix) {
			const response = NextResponse.next();
			response.headers.set(LOCALE_HEADER, defaultLocale);

			return response;
		}

		// [cp] Pathname already has a locale prefix
		// Example: /it/parcels, /it/treatments
		// Action: Extract and use the locale from the pathname
		// Note: This takes precedence over token locale (URL is source of truth)
		const pathnameHasLocale = localeRegex.test(pathname);
		if (pathnameHasLocale) {
			const response = NextResponse.next();
			response.headers.set(LOCALE_HEADER, getLocaleFromPathname(pathname));

			return response;
		}

		// [cp] Public route without locale prefix
		// Example: /auth/signin, /api/health
		// Action: Use token locale if user is logged in, otherwise detect from browser headers
		// This allows logged-in users to see auth pages in their preferred language
		const isPublicRoute = PUBLIC_ROUTES.some((route) =>
			pathname.startsWith(route),
		);
		if (isPublicRoute) {
			const locale = token?.locale || getLocaleFromHeaders(req);
			const response = NextResponse.next();
			response.headers.set(LOCALE_HEADER, locale);

			return response;
		}

		// [cp] Root path "/" with authenticated user
		// Example: User visits "/" while logged in
		// Action: Redirect to their preferred locale (e.g., /it or /en)
		// This ensures users always land on a localized version of the home page
		if (pathname === "/" && token) {
			const locale = token.locale ?? defaultLocale;
			const response = NextResponse.redirect(new URL(`/${locale}`, req.url));
			response.headers.set(LOCALE_HEADER, locale);

			return response;
		}

		// [cp] Protected route without locale prefix
		// Example: /parcels, /treatments, /profile (when accessed without locale)
		// Action: Determine locale (token or headers), then redirect to add locale prefix
		// This ensures all user-facing routes have locale prefixes
		const locale = token?.locale || getLocaleFromHeaders(req);
		req.nextUrl.pathname = `/${locale}${pathname}`;
		const response = NextResponse.redirect(req.nextUrl);
		response.headers.set(LOCALE_HEADER, locale);
		return response;
	},
	{
		callbacks: {
			authorized: ({ token, req }) => {
				const { pathname } = req.nextUrl;

				const isPublicRoute = PUBLIC_ROUTES.some((route) =>
					pathname.startsWith(route),
				);

				if (isPublicRoute) {
					return true;
				}

				return !!token;
			},
		},
		pages: {
			signIn: "/auth/signin",
		},
	},
);

export const config = {
	matcher: [
		"/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
	],
};
