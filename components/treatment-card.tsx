import { type Disease, TreatmentStatus } from "@prisma/client";
import { MapPin, Calendar, Droplets } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "./ui/card";
import { type TreatmentType } from "@/lib/data-fetcher";

export function TreatmentCard({
	parcelName,
	treatment,
	diseases,
}: {
	parcelName: string;
	treatment: Pick<
		TreatmentType,
		| "diseaseIds"
		| "status"
		| "dateMin"
		| "dateMax"
		| "appliedDate"
		| "productApplications"
		| "waterDose"
	>;
	diseases: Pick<Disease, "id" | "name">[];
}) {
	return (
		<Card>
			<CardContent className="p-4">
				<div className="flex justify-between items-start mb-3">
					<div>
						<p className="text-sm text-gray-600">
							Target:{" "}
							{treatment.diseaseIds
								.map((diseaseId) => {
									return diseases.find((disease) => disease.id === diseaseId)
										?.name;
								})
								.join(", ")}
						</p>
					</div>
					<Badge
						variant={
							treatment.status === TreatmentStatus.DONE
								? "default"
								: "secondary"
						}
					>
						{treatment.status === TreatmentStatus.DONE
							? "Completed"
							: "Pending"}
					</Badge>
				</div>

				<div className="flex items-center text-sm text-gray-600 mb-2">
					<MapPin className="h-4 w-4 mr-1" />
					{parcelName}
				</div>

				{treatment.dateMin && (
					<div className="flex items-center text-sm text-gray-600 mb-2">
						<Calendar className="h-4 w-4 mr-1" />
						{treatment.status === TreatmentStatus.DONE && treatment.appliedDate
							? `Applied: ${format(new Date(treatment.appliedDate), "MMM dd, yyyy")}`
							: `Scheduled: ${format(new Date(treatment.dateMin), "MMM dd")} - ${
									treatment.dateMax
										? format(new Date(treatment.dateMax), "MMM dd, yyyy")
										: "Open"
								}`}
					</div>
				)}

				{treatment.waterDose && (
					<div className="flex items-center text-sm text-gray-600 mb-3">
						<Droplets className="h-4 w-4 mr-1" />
						Water: {treatment.waterDose}L
					</div>
				)}

				{treatment.productApplications.length > 0 && (
					<div>
						<p className="text-sm font-medium mb-2">Products Used:</p>
						<div className="space-y-1">
							{treatment.productApplications.map((app, index) => (
								<div
									key={index}
									className="text-sm text-gray-600 bg-gray-50 p-2 rounded"
								>
									<div className="font-medium">
										{app.product.brand} {app.product.name}
									</div>
									<div>Dose: {app.dose}gr</div>
									{app.product.composition.length > 0 && (
										<div className="text-xs mt-1">
											Active substances:{" "}
											{app.product.composition
												.map((c) => c.substance.name)
												.join(", ")}
										</div>
									)}
								</div>
							))}
						</div>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
