import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { Errors } from "@/app/const";

export async function GET() {
	const session = await getServerSession(authOptions);

	if (!session) {
		return NextResponse.json({ error: Errors.UNAUTHORIZED }, { status: 401 });
	}

	try {
		const parcels = await prisma.parcel.findMany({
			where: { userId: session.user.id },
			include: {
				treatments: {
					include: {
						productApplications: {
							include: {
								product: {
									include: {
										composition: {
											include: {
												substance: true,
											},
										},
									},
								},
							},
						},
						parcel: true,
					},
					orderBy: {
						appliedDate: "desc",
					},
				},
			},
			orderBy: { createdAt: "desc" },
		});

		return NextResponse.json(parcels);
	} catch (error) {
		console.error("Error fetching parcels", error);
		return NextResponse.json(
			{ error: Errors.INTERNAL_SERVER },
			{ status: 500 },
		);
	}
}
