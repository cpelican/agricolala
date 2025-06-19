import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createParcelSchema } from "./schema";

export async function POST(request: NextRequest) {
	const session = await getServerSession(authOptions);

	if (!session) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const body = await request.json();
		const validatedData = createParcelSchema.parse(body);

		const parcel = await prisma.parcel.create({
			data: {
				...validatedData,
				userId: session.user.id,
			},
		});

		return NextResponse.json(parcel);
	} catch (error) {
		if (error instanceof Error && error.name === "ZodError") {
			return NextResponse.json(
				{ error: "Invalid input data" },
				{ status: 400 },
			);
		}

		console.error("Error creating parcel:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
