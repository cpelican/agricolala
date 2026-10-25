"use server";

import { getAuthorizedSession } from "@/lib/auth-utils";
import { Errors } from "@/lib/constants";
import { generateTreatmentsExcel } from "./excel-export";

export async function downloadTreatmentsExcel(year: number) {
	const session = await getAuthorizedSession();
	if (!session) {
		throw new Error(Errors.ACCESS_DENIED);
	}

	try {
		const excelBuffer = await generateTreatmentsExcel(session.user.id, year);

		// Return the Excel file as a base64 string for client-side download
		const base64Data = excelBuffer.toString("base64");

		return {
			success: true,
			data: base64Data,
			filename: `treatments-${year}-${session.user.email}.xlsx`,
		};
	} catch (error) {
		console.error("Error generating Excel file", error);
		throw new Error(Errors.INTERNAL_SERVER);
	}
}
