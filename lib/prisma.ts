import { PrismaClient } from "@prisma/client";
import { taintUtils } from "@/lib/taint-utils";

const globalForPrisma = globalThis as unknown as {
	prisma: PrismaClient | undefined;
};

taintUtils.taintDatabaseCredentials();

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
