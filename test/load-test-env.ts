import { existsSync } from "fs";
import { resolve } from "path";
import { config } from "dotenv";

const TEST_ENV_PATH = resolve(process.cwd(), ".env.test");

/** Defaults match docker-compose.test.yml and CI (.github/workflows/test.yml). */
const TEST_ENV_DEFAULTS: Record<string, string> = {
	DATABASE_URL:
		"postgresql://agraria:agraria@localhost:5433/agraria?schema=public",
	DIRECT_URL:
		"postgresql://agraria:agraria@localhost:5433/agraria?schema=public",
	POSTGRES_USER: "agraria",
	POSTGRES_PASSWORD: "agraria",
	CRON_SECRET: "test-cron-secret",
	CRON_ALLOW_AS_OF: "true",
	PORT: "3001",
	NODE_ENV: "test",
	NEXTAUTH_URL: "http://localhost:3001",
	NEXTAUTH_SECRET: "test-nextauth-secret",
	GOOGLE_CLIENT_ID: "test-client-id",
	GOOGLE_CLIENT_SECRET: "test-client-secret",
};

let hasWarnedAboutMissingEnvFile = false;

export function applyTestEnv() {
	if (existsSync(TEST_ENV_PATH)) {
		config({ path: TEST_ENV_PATH, override: true });
	} else if (!hasWarnedAboutMissingEnvFile) {
		hasWarnedAboutMissingEnvFile = true;
		console.warn(
			"[tests] .env.test not found — using built-in defaults (port 5433). Copy .env.test.example to .env.test to customize.",
		);
	}

	for (const [key, value] of Object.entries(TEST_ENV_DEFAULTS)) {
		process.env[key] ??= value;
	}
}
