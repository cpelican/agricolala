import { beforeEach } from "vitest";
import { cleanDatabase } from "./setup-utilities";

// Setup runs before each test
beforeEach(async () => {
	if (process.env.ENABLE_DB_TESTS !== "true") {
		return;
	}

	// Clean database before each test for isolation
	await cleanDatabase();
});
