import { cache } from "react";
import { prisma } from "./prisma";

export const getCachedDiseases = cache(async () => {
	return prisma.disease.findMany({
		select: { id: true, name: true },
		orderBy: { name: "asc" },
	});
});

export const getCachedProducts = cache(async () => {
	return prisma.product.findMany({
		select: { id: true, name: true },
		orderBy: { name: "asc" },
	});
});

// Optional: Function to revalidate the cache if needed
export async function revalidateDiseases() {
	const diseases = await prisma.disease.findMany({
		select: { id: true, name: true },
		orderBy: { name: "asc" },
	});
	return diseases;
}

export async function revalidateProducts() {
	const products = await prisma.product.findMany({
		select: { id: true, name: true },
		orderBy: { name: "asc" },
	});
	return products;
}
