export type SubstanceData = {
	name: string;
	totalDoseOfProduct: number;
	totalUsedOfPureActiveSubstance: number;
	totalUsedOfPureActiveSubstancePerHa: number;
	maxDosage: number;
	monthlyData: number[];
	applications: {
		date: Date;
		dose: number;
		parcel: string;
	}[];
};
