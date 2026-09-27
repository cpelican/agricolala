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
		select: { id: true, name: true, maxApplications: true, doseUnit: true },
		orderBy: { name: "asc" },
	});
});

export async function getProductDoseUnits(productIds: string[]) {
	return prisma.product.findMany({
		where: { id: { in: productIds } },
		select: {
			id: true,
			doseUnit: true,
			productLiterToKiloGramConversionRate: true,
		},
	});
}

const substanceToColors = {
	Copper: "rgb(59, 130, 246)",
	Sulfur: "rgb(34, 197, 94)",
} as const;

export const getCachedCompositions = cache(async () => {
	const compositions = await prisma.substanceDose.findMany({
		select: {
			id: true,
			dose: true,
			productId: true,
			substanceId: true,
			substance: {
				select: {
					name: true,
					maxDosage: true,
				},
			},
		},
	});

	return compositions.reduce(
		(
			acc: Record<string, Record<string, (typeof compositions)[number]>>,
			value,
		) => {
			if (!acc[value.substanceId]) {
				acc[value.substanceId] = {};
			}
			// a product cannot be composed of 2 same substances
			acc[value.substanceId][value.productId] = value;
			if (!acc[value.productId]) {
				acc[value.productId] = {};
			}
			acc[value.productId][value.substanceId] = value;
			return acc;
		},
		{},
	);
});

export const getCachedSubstances = cache(async () => {
	const substances = await prisma.substance.findMany({
		select: {
			id: true,
			name: true,
			maxDosage: true,
			maxDosageUnitPerAreaUnit: true,
			diseases: { select: { id: true } },
		},
		orderBy: { name: "asc" },
	});

	return substances.map((substance) => {
		const base = {
			id: substance.id,
			name: substance.name,
			maxDosage: substance.maxDosage,
			maxDosageUnitPerAreaUnit: substance.maxDosageUnitPerAreaUnit,
			diseaseIds: substance.diseases.map((d) => d.id),
		};
		if (substance.name in substanceToColors) {
			return {
				...base,
				color:
					substanceToColors[substance.name as keyof typeof substanceToColors],
			};
		}
		return { ...base, color: "rgb(182, 182, 182)" };
	});
});

// Cache should not be a problem if it doesnt last too long
export const getCurrentDiseases = cache(
	async (
		testDate?: Date,
	): Promise<{ id: string; name?: string; substances: { id: string }[] }[]> => {
		const currentMonth = testDate
			? testDate.getMonth() + 1
			: new Date().getMonth() + 1;

		return await prisma.disease.findMany({
			select: {
				id: true,
				name: testDate ? true : false, // we need to fetch the name to be able to test it
				substances: {
					select: {
						id: true,
					},
				},
			},
			where: {
				sensitivityMonthMin: {
					lte: currentMonth,
				},
				sensitivityMonthMax: {
					gte: currentMonth,
				},
			},
		});
	},
);
