export type SubstanceData = {
	name: string;
	totalDoseOfProduct: number;
	totalUsedOfPureActiveSubstance: number;
	/** Pure active substance applied per hectare of treated area, in grams (g/ha). */
	totalUsedOfPureActiveSubstancePerHaGrams: number;
	maxDosage: number;
	monthlyData: number[];
	applicationCount: number;
};
