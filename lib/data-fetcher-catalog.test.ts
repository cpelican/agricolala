import { describe, test, expect, beforeEach } from "vitest";
import { DiseaseSensitivityLevel, PhenologicalStage } from "@prisma/client";
import { cleanDatabase, seedTestData } from "@/test/setup-utilities";
import { PHENOLOGICAL_STAGES } from "./phenology";
import { getCachedDiseaseStageSensitivities } from "./data-fetcher-catalog";
import { getSensitivityLevel } from "./disease-stage-sensitivity";

describe("[Integration] disease stage sensitivities", () => {
	let testData: Awaited<ReturnType<typeof seedTestData>>;

	beforeEach(async () => {
		await cleanDatabase();
		testData = await seedTestData();
	});

	test("returns one level per seeded disease and stage", async () => {
		const { oidium, peronospora } = testData;
		const sensitivities = await getCachedDiseaseStageSensitivities();

		expect(sensitivities).toHaveLength(2 * PHENOLOGICAL_STAGES.length);
		expect(
			getSensitivityLevel(
				sensitivities,
				peronospora.id,
				PhenologicalStage.BUD_BREAK,
			),
		).toBe(DiseaseSensitivityLevel.NONE);
		expect(
			getSensitivityLevel(
				sensitivities,
				oidium.id,
				PhenologicalStage.FLOWERING,
			),
		).toBe(DiseaseSensitivityLevel.VERY_HIGH);
	});
});
