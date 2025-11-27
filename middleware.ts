import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import { defaultLocale } from "@/lib/translations-helpers";

export default withAuth(
	function middleware(req) {
		const { pathname } = req.nextUrl;
		const token = req.nextauth.token;

		if (pathname === "/" && token) {
			const locale = (token.locale as string) || defaultLocale;
			return NextResponse.redirect(new URL(`/${locale}`, req.url));
		}

		return NextResponse.next();
	},
	{
		callbacks: {
			authorized: ({ token, req }) => {
				const { pathname } = req.nextUrl;

				const publicRoutes = ["/auth", "/api/auth", "/api/health", "/api/cron"];

				const isPublicRoute = publicRoutes.some((route) =>
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
