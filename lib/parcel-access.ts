import { type Prisma } from "@prisma/client";

// The access rule for shared parcels (design-docs/shared-parcels.md): a user sees a
// parcel, its treatments and its stage when they are one of its members. Creator-only
// (Parcel.userId) and author-only (Treatment.userId) checks stay where they are used.

export function parcelAccessWhere(userId: string) {
	return { members: { some: { userId } } } satisfies Prisma.ParcelWhereInput;
}

export function treatmentAccessWhere(userId: string) {
	return {
		parcel: parcelAccessWhere(userId),
	} satisfies Prisma.TreatmentWhereInput;
}
