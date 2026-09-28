"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { taintUtils } from "@/lib/taint-utils";
import { Errors } from "@/lib/constants";
import { generateTreatmentsExcel } from "./excel-export";

export async function downloadTreatmentsExcel(year: number) {
	const session = await getServerSession(authOptions);
	if (!session?.user?.id || !session.user.isAuthorized) {
		throw new Error(Errors.ACCESS_DENIED);
	}

	taintUtils.taintUserSession(session.user);

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
