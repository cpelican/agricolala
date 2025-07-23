import { PrismaClient } from "@prisma/client";
import { config } from "dotenv";
import { resolve } from "path";

let _testPrisma: PrismaClient | null = null;

config({ path: resolve(process.cwd(), ".env.test") });

export function getTestPrisma(): PrismaClient {
	if (!_testPrisma) {
		_testPrisma = new PrismaClient();
	}
	return _testPrisma;
}
