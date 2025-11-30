import { Locale } from "@/lib/translations-helpers";
import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
	interface Session {
		user: {
			id: string;
			name?: string | null;
			email?: string | null;
			image?: string | null;
			isAuthorized: boolean;
			locale: Locale;
		};
	}

	type User = Pick<Session["user"], "isAuthorized" | "locale">;
}

declare module "next-auth/jwt" {
	interface JWT {
		id: string;
		isAuthorized: boolean;
		locale: Locale;
	}
}
