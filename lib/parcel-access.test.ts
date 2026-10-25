import { describe, expect, test } from "vitest";
import { parcelAccessWhere, treatmentAccessWhere } from "./parcel-access";

describe("parcel access rule", () => {
	test("a parcel is visible to its members", () => {
		expect(parcelAccessWhere("user-1")).toEqual({
			members: { some: { userId: "user-1" } },
		});
	});

	test("a treatment is visible through its parcel, whoever recorded it", () => {
		expect(treatmentAccessWhere("user-1")).toEqual({
			parcel: { members: { some: { userId: "user-1" } } },
		});
	});
});
