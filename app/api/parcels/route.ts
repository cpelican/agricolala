import { getServerSession } from "next-auth";
import { type NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
	const session = await getServerSession(authOptions);

	if (!session) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const body = await request.json();
		const { name, width, height, type, latitude, longitude } = body;

		const parcel = await prisma.parcel.create({
			data: {
				name,
				width,
				height,
				type,
				latitude,
				longitude,
				userId: session.user.id,
			},
		});

		return NextResponse.json(parcel);
	} catch (error) {
		console.error("Error creating parcel:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
