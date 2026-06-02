import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "./prisma";
import { taintUtils } from "@/lib/taint-utils";
import { defaultLocale, getLanguageAsLocale } from "@/lib/translations-helpers";
import { INVALID_SESSION_ID } from "@/lib/constants";

taintUtils.taintOAuthSecrets();

const isTestEnv =
	!!process.env.TEST_USER_EMAIL &&
	!!process.env.TEST_USER_PASSWORD &&
	process.env.VERCEL_ENV !== "production";

if (!process.env.GOOGLE_CLIENT_ID && !isTestEnv) {
	throw new Error("GOOGLE_CLIENT_ID environment variable is required");
}

if (!process.env.GOOGLE_CLIENT_SECRET && !isTestEnv) {
	throw new Error("GOOGLE_CLIENT_SECRET environment variable is required");
}

if (!process.env.NEXTAUTH_SECRET) {
	throw new Error("NEXTAUTH_SECRET environment variable is required");
}

const providers: NextAuthOptions["providers"] = [];

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
	providers.push(
		GoogleProvider({
			clientId: process.env.GOOGLE_CLIENT_ID,
			clientSecret: process.env.GOOGLE_CLIENT_SECRET,
		}),
	);
}

if (isTestEnv) {
	providers.push(
		CredentialsProvider({
			name: "Test Credentials",
			credentials: {
				email: { label: "Email", type: "email" },
				password: { label: "Password", type: "password" },
			},
			async authorize(credentials) {
				if (!credentials?.email || !credentials?.password) {
					return null;
				}
				if (
					credentials.email === process.env.TEST_USER_EMAIL &&
					credentials.password === process.env.TEST_USER_PASSWORD
				) {
					const user = await prisma.user.upsert({
						where: { email: credentials.email },
						update: { emailVerified: new Date() },
						create: {
							email: credentials.email,
							name: "Test User",
							emailVerified: new Date(),
							isAuthorized: true,
							locale: defaultLocale,
						},
					});
					return {
						id: user.id,
						email: user.email,
						name: user.name,
						isAuthorized: user.isAuthorized,
						locale: user.locale as "en" | "it",
					};
				}
				return null;
			},
		}),
	);
}

export const authOptions: NextAuthOptions = {
	session: {
		strategy: "jwt",
	},
	providers,
	callbacks: {
		/**
		 * [cp] Called right after the provider (Google) authenticates
		 * the user but before the JWT token is created.
		 *
		 * @param user - The user object returned by the OAuth provider (Google), containing profile
		 *               information like email, name, and image.
		 * @param account - The OAuth account information from the provider
		 *
		 * Why we update the user:
		 * - Ensure the user exists in our database (create if new, update if existing)
		 * - Keep user profile data (name, image) in sync with the OAuth provider
		 * - Mark email as verified since it's been verified by the OAuth provider
		 * - This database record is then used by the jwt callback to populate the JWT token
		 */
		async signIn({ user, account }) {
			if (user.email && account) {
				try {
					const userData = {
						name: "name" in user ? user.name : null,
						image: "image" in user ? user.image : null,
					};

					await prisma.user.upsert({
						where: { email: user.email },
						update: {
							name: userData.name ?? undefined,
							image: userData.image ?? undefined,
							emailVerified: new Date(),
						},
						create: {
							email: user.email,
							name: userData.name,
							image: userData.image,
							emailVerified: new Date(),
							locale: defaultLocale,
						},
					});
				} catch (error) {
					console.error("Error during sign-in callback:", error);
					return false;
				}
			}
			return true;
		},
		/**
		 * Called in two scenarios:
		 * 1. Right after the signIn callback, this populates the JWT token with user
		 *    data from the database for the first time.
		 * 2. On every subsequent request (when `user` is absent): Returns the existing
		 *    token without database queries, leveraging JWT's stateless nature.
		 *
		 * @param token - The JWT token object that gets encoded and sent to the client
		 * @param user - Present only during initial sign-in, contains OAuth provider user data
		 *
		 * Re-resolves `token.id` from the database by email on each call so a JWT
		 * survives DB resets/migrations without breaking foreign keys.
		 */
		async jwt({ token, user }) {
			const email =
				typeof user?.email === "string"
					? user.email
					: typeof token.email === "string"
						? token.email
						: null;

			if (!email) {
				return token;
			}

			token.email = email;

			try {
				const dbUser = await prisma.user.findUniqueOrThrow({
					where: { email },
					select: {
						id: true,
						isAuthorized: true,
						locale: true,
					},
				});

				token.id = dbUser.id;
				token.isAuthorized = dbUser.isAuthorized;
				token.locale = getLanguageAsLocale(dbUser.locale);
			} catch (error) {
				console.error("Error fetching user in JWT callback:", error);
				token.id = undefined;
				token.isAuthorized = false;
			}

			return token;
		},
		/**
		 * Called whenever `getServerSession()` is invoked in the application.
		 *
		 * This callback transforms the JWT token (which contains our custom fields) into the
		 * session object that your components and API routes consume.
		 *
		 * @param session - The base session object from NextAuth (contains default fields like email, name, image from the OAuth provider)
		 * @param token - The JWT token that was populated by the jwt callback
		 *
		 */
		session: ({ session, token }) => {
			// If token is invalid or missing required data
			// This should only happen in edge cases (corrupted token, old token format, etc.)
			// For protected routes, middleware should have already validated the token
			if (!token || !token.id) {
				// Return minimal session - let requireAuth() or route-level checks handle validation
				// This allows public routes to gracefully handle missing sessions
				return {
					...session,
					user: {
						...session.user,
						id: INVALID_SESSION_ID,
						isAuthorized: false,
						locale: defaultLocale,
					},
				};
			}

			return {
				...session,
				user: {
					...session.user,
					id: token.id,
					isAuthorized: token.isAuthorized,
					locale: token.locale,
				},
			};
		},
	},
	pages: {
		signIn: "/auth/signin",
	},
};
