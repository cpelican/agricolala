"use client";

import { Calendar } from "lucide-react";
import {
	Card,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { TreatmentStatus } from "@prisma/client";
import { TreatmentCard } from "./treatment-card";
import { type TreatmentType } from "@/lib/parcel-helpers";
import { useDiseases } from "@/contexts/cached-data-context";

interface TreatmentsContentProps {
	treatments: TreatmentType[];
}

export function TreatmentsContent({ treatments }: TreatmentsContentProps) {
	const diseases = useDiseases();
	const upcomingTreatments = treatments.filter(
		(t) => t.status === TreatmentStatus.TODO,
	);
	const completedTreatments = treatments.filter(
		(t) => t.status === TreatmentStatus.DONE,
	);

	if (treatments.length === 0) {
		return (
			<div className="p-4">
				<Card>
					<CardHeader className="text-center">
						<CardTitle>No Treatments Yet</CardTitle>
						<CardDescription>
							Treatments will appear here once you add parcels and schedule
							treatments
						</CardDescription>
					</CardHeader>
				</Card>
			</div>
		);
	}

	return (
		<div className="p-4 space-y-6">
			{upcomingTreatments.length > 0 && (
				<div>
					<h2 className="text-lg font-semibold mb-3 flex items-center">
						<Calendar className="h-5 w-5 mr-2 text-orange-500" />
						Upcoming Treatments ({upcomingTreatments.length})
					</h2>
					<div className="space-y-3">
						{upcomingTreatments.map((treatment) => (
							<TreatmentCard
								key={treatment.id}
								parcelName={treatment.parcel.name}
								treatment={treatment}
								diseases={diseases}
							/>
						))}
					</div>
				</div>
			)}

			{completedTreatments.length > 0 && (
				<div>
					<h2 className="text-lg font-semibold mb-3 flex items-center">
						<Calendar className="h-5 w-5 mr-2 text-green-500" />
						Completed Treatments ({completedTreatments.length})
					</h2>
					<div className="space-y-3">
						{completedTreatments.map((treatment) => (
							<TreatmentCard
								parcelName={treatment.parcel.name}
								key={treatment.id}
								treatment={treatment}
								diseases={diseases}
							/>
						))}
					</div>
				</div>
			)}
		</div>
	);
}
