import {
	experimental_taintObjectReference,
	experimental_taintUniqueValue,
	type Reference,
} from "react";

export const taintUtils = {
	taintObject: (message: string, obj: Reference) => {
		if (!["production", "test"].includes(process.env.NODE_ENV || "")) {
			experimental_taintObjectReference(message, obj);
		}
	},
	taintUserSession: (user: Reference) => {
		if (!["production", "test"].includes(process.env.NODE_ENV || "")) {
			experimental_taintObjectReference(
				"Do not pass user session data to the client. Instead, pick off specific properties you need.",
				user,
			);
		}
	},
	taintDatabaseCredentials: () => {
		if (!["production", "test"].includes(process.env.NODE_ENV || "")) {
			if (process.env.DATABASE_URL) {
				experimental_taintUniqueValue(
					"Do not pass database URLs to the client.",
					process,
					process.env.DATABASE_URL,
				);
			}
			if (process.env.DIRECT_URL) {
				experimental_taintUniqueValue(
					"Do not pass database URLs to the client.",
					process,
					process.env.DIRECT_URL,
				);
			}
		}
	},
	taintOAuthSecrets: () => {
		if (!["production", "test"].includes(process.env.NODE_ENV || "")) {
			if (process.env.GOOGLE_CLIENT_SECRET) {
				experimental_taintUniqueValue(
					"Do not pass OAuth secrets to the client.",
					process,
					process.env.GOOGLE_CLIENT_SECRET,
				);
			}
			if (process.env.NEXTAUTH_SECRET) {
				experimental_taintUniqueValue(
					"Do not pass NextAuth secrets to the client.",
					process,
					process.env.NEXTAUTH_SECRET,
				);
			}
		}
	},
	taintBusinessLogic: <Type extends Reference>(obj: Type) => {
		if (!["production", "test"].includes(process.env.NODE_ENV || "")) {
			experimental_taintObjectReference(
				"Do not pass proprietary agricultural calculation logic to the client.",
				obj,
			);
		}
	},
};
