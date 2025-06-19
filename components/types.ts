export type SubstanceData = {
	name: string;
	totalUsed: number;
	maxDosage: number;
	monthlyData: number[];
	applications: {
		date: Date;
		dose: number;
		parcel: string;
	}[];
};
