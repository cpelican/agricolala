import { userInfo } from "node:os";

/** Local Docker & CI — `docker-compose.e2e.yml` publishes Postgres on 5434. */
export const E2E_DOCKER_DATABASE_URL =
	"postgresql://agraria:agraria@127.0.0.1:5434/agraria?schema=public";

export type E2eDbSetup = "docker" | "native";

/** `docker` (default): Docker Compose. `native`: host Postgres (remote agents). */
export function getE2eDbSetup(): E2eDbSetup {
	return process.env.E2E_DB_SETUP === "native" ? "native" : "docker";
}

function nativeE2eDatabaseUrl(): string {
	const user = process.env.E2E_POSTGRES_USER ?? userInfo().username;
	const db = process.env.E2E_POSTGRES_DB ?? "agraria_e2e";
	// Port 5434 matches Docker e2e; `host` uses the local socket on cloud agents.
	return `postgresql://${user}@127.0.0.1:5434/${db}?host=/var/run/postgresql&schema=public`;
}

export function getE2eDatabaseUrl(): string {
	if (process.env.E2E_DATABASE_URL) {
		return process.env.E2E_DATABASE_URL;
	}

	return getE2eDbSetup() === "native"
		? nativeE2eDatabaseUrl()
		: E2E_DOCKER_DATABASE_URL;
}

export function applyE2eDatabaseEnv() {
	const url = getE2eDatabaseUrl();
	process.env.DATABASE_URL = url;
	process.env.DIRECT_URL = url;
}
