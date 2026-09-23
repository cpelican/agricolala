import { TreatmentStatus } from "@prisma/client";
import { cache } from "react";
import { prisma } from "./prisma";

// Extends productApplicationsSelect with daysBetweenApplications for the coverage widget.
// Kept separate so the shared select used everywhere else stays unchanged.
const coverageProductApplicationsSelect = {
	dose: true,
	product: {
		select: {
			id: true,
			daysBetweenApplications: true,
			composition: {
				select: {
					dose: true,
					substanceId: true,
				},
			},
		},
	},
};

export const getTreatmentsWithParcelWeather = cache(async (userId: string) => {
	const yearStart = new Date(new Date().getFullYear(), 0, 1);
	return await prisma.parcel.findMany({
		where: { userId },
		select: {
			id: true,
			name: true,
			width: true,
			height: true,
			latitude: true,
			longitude: true,
			treatments: {
				select: {
					id: true,
					appliedDate: true,
					productApplications: {
						select: coverageProductApplicationsSelect,
					},
				},
				where: {
					status: TreatmentStatus.DONE,
					appliedDate: { gte: yearStart, not: null },
				},
				orderBy: { appliedDate: "asc" as const },
				// No take limit — we need all treatments to compute washoff correctly
			},
			weatherHistories: {
				select: {
					dateTime: true,
					cumulativePrecipitation: true,
				},
				where: { dateTime: { gte: yearStart } },
				orderBy: { dateTime: "asc" as const },
			},
		},
	});
});

export type CoverageParcel = Awaited<
	ReturnType<typeof getTreatmentsWithParcelWeather>
>[number];
