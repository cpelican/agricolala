import z from "zod";

export const createTreatmentSchema = z.object({
	appliedDate: z.date().default(() => new Date()),
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
	parcelId: z.string().min(1, "Parcel is required"),
});

export type CreateTreatmentSchema = z.infer<typeof createTreatmentSchema>;
export type CreateTreatmentAutomaticValuesSchema = z.infer<
	typeof createTreatmentAutomaticValuesSchema
>;
