import { type NextRequest, NextResponse } from "next/server";
import { Errors } from "@/lib/constants";
import { fetchWeatherHistory } from "@/lib/cron-fetch-weather-history";

export async function GET(request: NextRequest) {
	const authHeader = request.headers.get("authorization");
	if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
		return NextResponse.json({ error: Errors.UNAUTHORIZED }, { status: 401 });
	}

	try {
		const taskResults = await fetchWeatherHistory();

		let totalEntriesCreated = 0;
		let tasksProcessed = 0;
		const errors: string[] = [];

		for (const result of taskResults) {
			if (result.success) {
				tasksProcessed++;
				totalEntriesCreated += result.entriesCreated;
			} else {
				errors.push(result.errorMessage);
			}
		}

		return NextResponse.json({
			success: true,
			message: `Processed ${tasksProcessed} tasks and created/updated ${totalEntriesCreated} weather history entries`,
			tasksProcessed,
			totalEntriesCreated,
			errors: errors.length > 0 ? errors : undefined,
		});
	} catch (error) {
		console.error("Error in weather history cron job:", error);
		return NextResponse.json(
			{
				error: Errors.INTERNAL_SERVER,
				message:
					error instanceof Error ? error.message : "Unknown error occurred",
			},
			{ status: 500 },
		);
	}
}
