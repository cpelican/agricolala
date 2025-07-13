import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateSubstanceAggregations } from "@/lib/update-substance-aggregations";

export async function DELETE(
	request: NextRequest,
	{ params }: { params: Promise<{ treatmentId: string }> },
) {
	const session = await getServerSession(authOptions);

	if (!session) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const { treatmentId } = await params;

		const treatment = await prisma.treatment.findFirst({
			where: {
				id: treatmentId,
				userId: session.user.id,
			},
		});

		if (!treatment) {
			return NextResponse.json(
				{ error: "Treatment not found or access denied" },
				{ status: 404 },
			);
		}

		await prisma.treatment.delete({
			where: {
				id: treatmentId,
			},
		});

		const currentYear = new Date().getFullYear();
		// After deleting a treatment we need to recalculate the substance aggregations
		await updateSubstanceAggregations(session.user.id, currentYear);

		return NextResponse.json({
			success: true,
			message: "Treatment deleted successfully",
		});
	} catch (error) {
		if (error instanceof Error && error.name === "ZodError") {
			return NextResponse.json(
				{
					error: "Invalid input data",
					details: error instanceof Error ? error.message : "Validation failed",
				},
				{ status: 400 },
			);
		}

		console.error("Error deleting treatment:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
