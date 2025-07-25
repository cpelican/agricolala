"use client";

import {
	Card,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { TreatmentStatus } from "@prisma/client";
import { TreatmentCard } from "./treatment-card";
import { type TreatmentType } from "@/lib/data-fetcher";
import { useDiseases } from "@/contexts/cached-data-context";
import { useTranslations } from "@/hooks/use-translations";

interface TreatmentsContentProps {
	treatments: TreatmentType[];
}

export function TreatmentsContent({ treatments }: TreatmentsContentProps) {
	const diseases = useDiseases();
	const { t } = useTranslations();

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
						<CardTitle>{t("treatments.noTreatments")}</CardTitle>
						<CardDescription>
							{t("treatments.noTreatmentsDescription")}
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
						{upcomingTreatments.length} {t("treatments.upcoming")}
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
						{completedTreatments.length} {t("treatments.completed")}
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
