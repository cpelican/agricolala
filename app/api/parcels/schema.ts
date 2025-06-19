import z from "zod";
import { CultureType } from "@prisma/client";

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

export type CreateParcelSchema = z.infer<typeof createParcelSchema>;
