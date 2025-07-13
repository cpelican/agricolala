import * as XLSX from "xlsx";
import { prisma } from "./prisma";
import {
	getCachedSubstances,
	getCachedCompositions,
	treatmentSelect,
	getParcels,
} from "./data-fetcher";
import { calculateSubstanceData } from "./substance-helpers";

interface ProductApplicationExportData {
	treatmentId: string;
	appliedDate: string;
	parcelName: string;
	productName: string;
	brand: string;
	dose: number;
	substances: string;
}

interface SubstanceUsageExportData {
	substanceName: string;
	totalUsed: number;
	totalUsedPerHa: number;
	maxDosage: number;
	complianceStatus: string;
	monthlyUsage: string;
}

export async function generateTreatmentsExcel(userId: string, year: number) {
	// Fetch all treatments for the user in the specified year
	const treatments = await prisma.treatment.findMany({
		where: {
			userId,
			appliedDate: {
				gte: new Date(year, 0, 1),
				lte: new Date(year, 11, 31),
			},
		},
		select: treatmentSelect,
		orderBy: {
			appliedDate: "desc",
		},
	});

	// Get cached data for calculations
	const substances = await getCachedSubstances();
	const compositions = await getCachedCompositions();
	const parcels = await getParcels(userId);

	// Prepare data for Excel sheets
	const productApplicationsData: ProductApplicationExportData[] = [];
	const substanceUsageData: SubstanceUsageExportData[] = [];

	// Process treatments
	treatments.forEach((treatment) => {
		// Process product applications
		treatment.productApplications.forEach((application) => {
			const substances = application.product.composition
				.map((comp) => {
					const substance =
						compositions[comp.substanceId][application.product.id]?.substance;
					return `${substance?.name} (${comp.dose}%)`;
				})
				.join(", ");

			productApplicationsData.push({
				treatmentId: treatment.id,
				appliedDate: treatment.appliedDate
					? treatment.appliedDate.toLocaleDateString()
					: "Not applied",
				parcelName: treatment.parcel.name,
				productName: application.product.name,
				brand: application.product.brand,
				dose: application.dose,
				substances,
			});
		});
	});

	// Calculate substance usage
	const substanceData = calculateSubstanceData(
		treatments.map((t) => ({
			id: t.id,
			appliedDate: t.appliedDate,
			parcelName: t.parcel.name,
			parcel: {
				width: parcels.find((p) => p.id === t.parcel.id)?.width || 0,
				height: parcels.find((p) => p.id === t.parcel.id)?.height || 0,
			},
			productApplications: t.productApplications.map((app) => ({
				dose: app.dose,
				product: {
					id: app.product.id,
					composition: app.product.composition.map((comp) => ({
						dose: comp.dose,
						substanceId: comp.substanceId,
					})),
				},
			})),
		})),
		compositions,
	);

	// Process substance usage data
	substanceData.forEach((substance) => {
		const substanceMeta = substances.find((s) => s.name === substance.name);
		const maxDosage = substanceMeta?.maxDosage || 0;
		const complianceStatus =
			substance.totalUsedOfPureActiveSubstancePerHa <= maxDosage
				? "Compliant"
				: "Exceeds limit";

		const monthlyUsage = substance.monthlyData
			.map((usage, month) => {
				const monthName = new Date(2024, month).toLocaleDateString("en", {
					month: "short",
				});
				return `${monthName}: ${usage.toFixed(2)}g`;
			})
			.join(", ");

		substanceUsageData.push({
			substanceName: substance.name,
			totalUsed: substance.totalUsedOfPureActiveSubstance,
			totalUsedPerHa: substance.totalUsedOfPureActiveSubstancePerHa,
			maxDosage,
			complianceStatus,
			monthlyUsage,
		});
	});

	const workbook = XLSX.utils.book_new();

	const productsSheet = XLSX.utils.json_to_sheet(productApplicationsData);
	const substancesSheet = XLSX.utils.json_to_sheet(substanceUsageData);

	XLSX.utils.book_append_sheet(workbook, productsSheet, "Product Applications");
	XLSX.utils.book_append_sheet(workbook, substancesSheet, "Substance Usage");

	// Generate Excel file
	const excelBuffer = XLSX.write(workbook, {
		bookType: "xlsx",
		type: "buffer",
	});

	return excelBuffer;
}
