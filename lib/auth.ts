import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "./prisma";
import { taintUtils } from "@/lib/taint-utils";
import type { Locale } from "@/lib/translations-helpers";

taintUtils.taintOAuthSecrets();

if (!process.env.GOOGLE_CLIENT_ID) {
	throw new Error("GOOGLE_CLIENT_ID environment variable is required");
}

if (!process.env.GOOGLE_CLIENT_SECRET) {
	throw new Error("GOOGLE_CLIENT_SECRET environment variable is required");
}

if (!process.env.NEXTAUTH_SECRET) {
	throw new Error("NEXTAUTH_SECRET environment variable is required");
}

export const authOptions: NextAuthOptions = {
	session: {
		strategy: "jwt",
	},
	providers: [
		GoogleProvider({
			clientId: process.env.GOOGLE_CLIENT_ID,
			clientSecret: process.env.GOOGLE_CLIENT_SECRET,
		}),
	],
	callbacks: {
		async signIn({ user, account }) {
			// Ensure user exists in database
			if (user.email && account) {
				try {
					const userData = {
						name: "name" in user ? user.name : null,
						image: "image" in user ? user.image : null,
					};

					const dbUser = await prisma.user.upsert({
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
							locale: "it",
						},
					});

					// Create or update account record
					if (account.providerAccountId) {
						await prisma.account.upsert({
							where: {
								provider_providerAccountId: {
									provider: account.provider,
									providerAccountId: account.providerAccountId,
								},
							},
							update: {
								access_token: account.access_token ?? undefined,
								refresh_token: account.refresh_token ?? undefined,
								expires_at: account.expires_at ?? undefined,
								token_type: account.token_type ?? undefined,
								scope: account.scope ?? undefined,
								id_token: account.id_token ?? undefined,
								session_state: account.session_state ?? undefined,
							},
							create: {
								userId: dbUser.id,
								type: account.type,
								provider: account.provider,
								providerAccountId: account.providerAccountId,
								access_token: account.access_token,
								refresh_token: account.refresh_token,
								expires_at: account.expires_at,
								token_type: account.token_type,
								scope: account.scope,
								id_token: account.id_token,
								session_state: account.session_state,
							},
						});
					}
				} catch (error) {
					// Log error and prevent sign-in if database operation fails
					console.error("Error during sign-in callback:", error);
					return false;
				}
			}
			return true;
		},
		async jwt({ token, user }) {
			if (user?.email) {
				try {
					const dbUser = await prisma.user.findUnique({
						where: { email: user.email },
						select: {
							id: true,
							isAuthorized: true,
							locale: true,
							email: true,
							name: true,
							image: true,
						},
					});

					if (!dbUser) {
						throw new Error("User not found in database");
					}

					token.id = dbUser.id;
					token.isAuthorized = dbUser.isAuthorized;
					token.locale = dbUser.locale as Locale;
					token.email = dbUser.email;
					token.name = dbUser.name;
					token.picture = dbUser.image;
				} catch (error) {
					console.error("Error fetching user in JWT callback:", error);
					throw error;
				}
			}

			// Refresh user data on each request to ensure it's up-to-date
			// This ensures changes to isAuthorized or user deletion are reflected immediately
			if (token.email && !user) {
				try {
					const dbUser = await prisma.user.findUnique({
						where: { email: token.email },
						select: {
							id: true,
							isAuthorized: true,
							locale: true,
						},
					});

					if (!dbUser) {
						// User was deleted - mark token as invalid
						// This will cause the session callback to return an invalid session
						token.id = "";
						token.isAuthorized = false;
						return token; // Return token but with invalid data
					}

					// Update token with fresh data
					token.id = dbUser.id;
					token.isAuthorized = dbUser.isAuthorized;
					token.locale = dbUser.locale as Locale;
				} catch (error) {
					// Database error - log but keep existing token data to avoid breaking requests
					// The session callback will handle validation
					console.error("Error refreshing user data in JWT callback:", error);
					// Continue with existing token data rather than breaking the request
				}
			}

			return token;
		},
		session: ({ session, token }) => {
			// If token is invalid or missing required data, return minimal session
			if (!token || !token.id || !token.email) {
				return {
					...session,
					user: {
						...session.user,
						id: "",
						isAuthorized: false,
						locale: "it",
					},
				};
			}

			return {
				...session,
				user: {
					...session.user,
					id: token.id as string,
					isAuthorized: token.isAuthorized as boolean,
					locale: token.locale as string,
				},
			};
		},
	},
	pages: {
		signIn: "/auth/signin",
	},
};
