import { type NextRequest, NextResponse } from "next/server";
import { Errors } from "@/lib/constants";
import { suggestTreatments } from "@/lib/cron-suggest-treatments";

/** Vitest/CI only: x-cron-as-of when CRON_ALLOW_AS_OF=true and not Vercel production. */
function isCronAsOfOverrideAllowed(): boolean {
	return (
		process.env.CRON_ALLOW_AS_OF === "true" &&
		process.env.VERCEL_ENV !== "production"
	);
}

function resolveCronReferenceDate(request: NextRequest): Date {
	if (isCronAsOfOverrideAllowed()) {
		const asOf = request.headers.get("x-cron-as-of");
		if (asOf) {
			const parsed = new Date(asOf);
			if (!Number.isNaN(parsed.getTime())) {
				return parsed;
			}
		}
	}
	return new Date();
}

export async function GET(request: NextRequest) {
	const authHeader = request.headers.get("authorization");
	if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
		return NextResponse.json({ error: Errors.UNAUTHORIZED }, { status: 401 });
	}

	try {
		const { suggestedTreatments, processedParcels } = await suggestTreatments(
			resolveCronReferenceDate(request),
		);

		return NextResponse.json({
			success: true,
			message: `Created ${suggestedTreatments} suggested treatments`,
			suggestedTreatments,
			processedParcels,
		});
	} catch (error) {
		console.error("Error in cron job:", error);
		return NextResponse.json(
			{ error: Errors.INTERNAL_SERVER },
			{ status: 500 },
		);
	}
}
