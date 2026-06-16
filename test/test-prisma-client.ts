import { PrismaClient } from "@prisma/client";
import { applyTestEnv } from "./load-test-env";

let _testPrisma: PrismaClient | null = null;

applyTestEnv();

export function getTestPrisma(): PrismaClient {
	if (!_testPrisma) {
		_testPrisma = new PrismaClient();
	}
	return _testPrisma;
}
