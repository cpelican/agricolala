import { PrismaAdapter } from "@next-auth/prisma-adapter";
import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "./prisma";
import { taintUtils } from "@/lib/taint-utils";

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
	adapter: PrismaAdapter(prisma),
	providers: [
		GoogleProvider({
			clientId: process.env.GOOGLE_CLIENT_ID,
			clientSecret: process.env.GOOGLE_CLIENT_SECRET,
		}),
	],
	callbacks: {
		session: ({ session, user }) => ({
			...session,
			user: {
				...session.user,
				id: user.id,
				isAuthorized: user.isAuthorized,
			},
		}),
	},
	pages: {
		signIn: "/auth/signin",
	},
};
