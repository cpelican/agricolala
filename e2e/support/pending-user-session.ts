import { type Browser } from "@playwright/test";
import { encode } from "next-auth/jwt";
import { pendingE2eUser } from "./e2e-data";
import { mobileUse } from "./playwright-mobile";

// Only the e2e user can sign in with credentials, so the waiting account gets a session
// cookie signed with the same secret as the dev server. The `jwt` callback then reads
// the account from the database by email, as it does for a Google sign-in.
export async function pendingUserContext(browser: Browser, baseURL: string) {
	const secret = process.env.NEXTAUTH_SECRET;
	if (!secret) {
		throw new Error("NEXTAUTH_SECRET is required to sign the pending user in");
	}
	const value = await encode({
		// isAuthorized and locale are placeholders: the jwt callback rereads them.
		token: {
			email: pendingE2eUser.email,
			name: pendingE2eUser.name,
			isAuthorized: false,
			locale: "en",
		},
		secret,
	});

	const context = await browser.newContext({
		...mobileUse,
		storageState: { cookies: [], origins: [] },
	});
	await context.addCookies([
		{
			name: "next-auth.session-token",
			value,
			url: baseURL,
			httpOnly: true,
			sameSite: "Lax",
		},
	]);
	return context;
}
