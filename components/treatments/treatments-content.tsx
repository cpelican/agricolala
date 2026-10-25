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
import { useTranslations } from "@/contexts/translations-context";
import { EYEBROW } from "@/components/ui/typography";

interface TreatmentsContentProps {
	treatments: TreatmentType[];
	currentUserId: string;
}

export function TreatmentsContent({
	treatments,
	currentUserId,
}: TreatmentsContentProps) {
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
		<div className="space-y-7 px-4 pt-3 pb-8">
			{upcomingTreatments.length > 0 && (
				<div>
					<h2 className={`m-0 mb-3 ${EYEBROW}`}>
						{upcomingTreatments.length} {t("treatments.upcoming")}
					</h2>
					<div className="space-y-3">
						{upcomingTreatments.map((treatment) => (
							<TreatmentCard
								key={treatment.id}
								parcelName={treatment.parcel.name}
								treatment={treatment}
								diseases={diseases}
								currentUserId={currentUserId}
							/>
						))}
					</div>
				</div>
			)}

			{completedTreatments.length > 0 && (
				<div>
					<h2 className={`m-0 mb-3 ${EYEBROW}`}>
						{completedTreatments.length} {t("treatments.completed")}
					</h2>
					<div className="space-y-3">
						{completedTreatments.map((treatment) => (
							<TreatmentCard
								parcelName={treatment.parcel.name}
								key={treatment.id}
								treatment={treatment}
								diseases={diseases}
								currentUserId={currentUserId}
							/>
						))}
					</div>
				</div>
			)}
		</div>
	);
}
