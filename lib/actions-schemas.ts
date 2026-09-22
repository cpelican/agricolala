import { CultureType } from "@prisma/client";
import z from "zod";
import { parcelBoundarySchema } from "./parcel-geometry";

export const createParcelSchema = z
	.object({
		name: z.string().min(1, "Name is required").max(100, "Name too long"),
		type: z.nativeEnum(CultureType),
		boundary: parcelBoundarySchema,
		altitude: z.number().min(-500).max(9000).optional(),
	})
	.strict();

export const createTreatmentSchema = z
	.object({
		appliedDate: z
			.union([z.string().transform((str) => new Date(str)), z.date()])
			.default(() => new Date()),
		parcelIds: z
			.array(z.string().min(1, "Parcel ID is required"))
			.min(1, "At least one parcel is required"),
		diseases: z
			.array(
				z.object({
					diseaseId: z.string().min(1, "Disease is required"),
				}),
			)
			.min(1, "At least one disease is required")
			.transform((diseases) => {
				const seen = new Set<string>();
				return diseases.filter((disease) => {
					if (seen.has(disease.diseaseId)) {
						return false;
					}
					seen.add(disease.diseaseId);
					return true;
				});
			}),
		waterDose: z
			.number()
			.min(0.1, "Water dose must be at least 0.1L")
			.default(10),
		productApplications: z
			.array(
				z.object({
					productId: z.string().min(1, "Product is required"),
					dose: z.number().min(0.1, "Dose must be at least 0.1g"),
				}),
			)
			.min(1, "At least one product is required")
			.refine(
				(applications) =>
					applications.every((app) => app.productId && app.dose > 0),
				{
					message: "All products must have a valid dose",
				},
			),
	})
	.strict();
