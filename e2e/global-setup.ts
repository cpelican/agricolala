import { execSync } from "node:child_process";
import { join } from "node:path";
import {
	applyE2eDatabaseEnv,
	getE2eDatabaseUrl,
	getE2eDbSetup,
} from "./support/e2e-env";

function runMigrateAndGenerate(root: string, databaseUrl: string): boolean {
	try {
		execSync("npx prisma migrate deploy", {
			cwd: root,
			stdio: "inherit",
			env: {
				...process.env,
				DATABASE_URL: databaseUrl,
				DIRECT_URL: databaseUrl,
			},
		});
		execSync("npx prisma generate", {
			cwd: root,
			stdio: "inherit",
		});
		return true;
	} catch {
		return false;
	}
}

/** Ensures e2e Postgres is up and migrated before any Playwright project runs. */
export default async function globalSetup() {
	applyE2eDatabaseEnv();

	const root = join(__dirname, "..");
	const databaseUrl = getE2eDatabaseUrl();
	const setup = getE2eDbSetup();

	if (runMigrateAndGenerate(root, databaseUrl)) {
		return;
	}

	const setupScript =
		setup === "docker"
			? join(root, "scripts", "setup-e2e-db.sh")
			: join(root, "scripts", "setup-e2e-native.sh");

	execSync(`bash "${setupScript}"`, {
		cwd: root,
		stdio: "inherit",
		env: {
			...process.env,
			DATABASE_URL: databaseUrl,
			DIRECT_URL: databaseUrl,
		},
	});
}
