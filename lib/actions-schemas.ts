import { CultureType } from "@prisma/client";
import z from "zod";

export const createParcelSchema = z.object({
	name: z.string().min(1, "Name is required").max(100, "Name too long"),
	width: z
		.number()
		.positive("Width must be positive")
		.max(10000, "Width too large"),
	height: z
		.number()
		.positive("Height must be positive")
		.max(10000, "Height too large"),
	type: z.nativeEnum(CultureType),
	latitude: z.number().min(-90).max(90, "Invalid latitude"),
	longitude: z.number().min(-180).max(180, "Invalid longitude"),
});

export const createTreatmentSchema = z.object({
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
		.min(1, "At least one disease is required"),
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
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const createTreatmentAutomaticValuesSchema = z.object({
	parcelIds: z.array(z.string().min(1, "Parcel ID is required")),
});

export type CreateTreatmentSchema = z.infer<typeof createTreatmentSchema>;
export type CreateTreatmentAutomaticValuesSchema = z.infer<
	typeof createTreatmentAutomaticValuesSchema
>;

export type CreateParcelSchema = z.infer<typeof createParcelSchema>;
