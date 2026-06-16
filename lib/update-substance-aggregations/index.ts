import "server-only";
import { prisma } from "../prisma";
import { updateSubstanceAggregations as updateSubstanceAggregationsCore } from "./core";

export async function updateSubstanceAggregations(
	userId: string,
	year: number = new Date().getFullYear(),
) {
	return updateSubstanceAggregationsCore(prisma, userId, year);
}
