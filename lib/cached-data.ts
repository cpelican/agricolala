import { prisma } from "./prisma";

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
