import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateSubstanceAggregations } from "@/lib/update-substance-aggregations";

export async function DELETE(
	request: NextRequest,
	{ params }: { params: Promise<{ parcelId: string }> },
) {
	const session = await getServerSession(authOptions);

	if (!session) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const { parcelId } = await params;

		const parcel = await prisma.parcel.findFirst({
			where: {
				id: parcelId,
				userId: session.user.id,
			},
		});

		if (!parcel) {
			return NextResponse.json(
				{ error: "Parcel not found or access denied" },
				{ status: 404 },
			);
		}

		await prisma.parcel.delete({
			where: {
				id: parcelId,
			},
		});

		const currentYear = new Date().getFullYear();
		await updateSubstanceAggregations(session.user.id, currentYear);

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Error deleting parcel:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
