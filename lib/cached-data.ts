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

const substanceToColors = {
	Copper: "rgb(59, 130, 246)",
	Sulfur: "rgb(34, 197, 94)",
} as const;

export const getCachedSubstances = cache(async () => {
	const substances = await prisma.substance.findMany({
		select: { id: true, name: true },
		orderBy: { name: "asc" },
	});

	return substances.map((substance) => {
		if (substance.name in substanceToColors) {
			return {
				...substance,
				color:
					substanceToColors[substance.name as keyof typeof substanceToColors],
			};
		}
		return { ...substance, color: "rgb(182, 182, 182)" };
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
