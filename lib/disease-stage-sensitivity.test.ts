import { DiseaseSensitivityLevel, PhenologicalStage } from "@prisma/client";
import { describe, test, expect } from "vitest";
import { PHENOLOGICAL_STAGES } from "./phenology";
import {
	DISEASE_STAGE_SENSITIVITY_MATRIX,
	SENSITIVITY_LEVELS,
	compareSensitivityLevels,
	getSensitivityLevel,
	getStageSensitivityRows,
	getDiseaseRiskTimeline,
	getSubstanceStageRisk,
	isCriticalLevel,
	isDiseaseActive,
} from "./disease-stage-sensitivity";

const peronospora = {
	id: "peronospora",
	sensitivityMonthMin: 3,
	sensitivityMonthMax: 7,
};
const sensitivities = getStageSensitivityRows("Peronospora").map((row) => ({
	...row,
	diseaseId: peronospora.id,
}));
const MAY = new Date(2026, 4, 15);
const SEPTEMBER = new Date(2026, 8, 15);

describe("sensitivity levels", () => {
	test("lists every enum value once", () => {
		expect([...SENSITIVITY_LEVELS].sort()).toEqual(
			Object.values(DiseaseSensitivityLevel).sort(),
		);
	});

	test("orders levels from no risk to very high", () => {
		expect(
			compareSensitivityLevels(
				DiseaseSensitivityLevel.NONE,
				DiseaseSensitivityLevel.VERY_HIGH,
			),
		).toBeLessThan(0);
		expect(
			compareSensitivityLevels(
				DiseaseSensitivityLevel.HIGH,
				DiseaseSensitivityLevel.MEDIUM,
			),
		).toBeGreaterThan(0);
	});

	test("high and very high are critical", () => {
		expect(SENSITIVITY_LEVELS.filter(isCriticalLevel)).toEqual([
			DiseaseSensitivityLevel.HIGH,
			DiseaseSensitivityLevel.VERY_HIGH,
		]);
	});
});

describe("sensitivity matrix", () => {
	test.each([
		"Peronospora",
		"Oidium",
	] as const)("%s has one row per stage, in season order", (diseaseName) => {
		expect(
			getStageSensitivityRows(diseaseName).map((row) => row.stage),
		).toEqual([...PHENOLOGICAL_STAGES]);
	});

	test("flowering and small berries are the peak for both mildews", () => {
		for (const levels of Object.values(DISEASE_STAGE_SENSITIVITY_MATRIX)) {
			expect(levels.FLOWERING).toBe(DiseaseSensitivityLevel.VERY_HIGH);
			expect(levels.FRUIT_SET).toBe(DiseaseSensitivityLevel.VERY_HIGH);
		}
	});
});

describe("getSensitivityLevel", () => {
	test("returns the level of the disease at the stage", () => {
		expect(
			getSensitivityLevel(
				sensitivities,
				peronospora.id,
				PhenologicalStage.FLOWERING,
			),
		).toBe(DiseaseSensitivityLevel.VERY_HIGH);
	});

	test("returns null for a disease without rows", () => {
		expect(
			getSensitivityLevel(sensitivities, "other", PhenologicalStage.FLOWERING),
		).toBeNull();
	});
});

describe("isDiseaseActive", () => {
	test("uses the stage level when the stage is known", () => {
		// May is inside the month window, but shoots are too short at bud break.
		expect(
			isDiseaseActive(
				peronospora,
				sensitivities,
				PhenologicalStage.BUD_BREAK,
				MAY,
			),
		).toBe(false);
		// September is outside the month window, but bunch closure is still medium.
		expect(
			isDiseaseActive(
				peronospora,
				sensitivities,
				PhenologicalStage.BUNCH_CLOSURE,
				SEPTEMBER,
			),
		).toBe(true);
		expect(
			isDiseaseActive(
				peronospora,
				sensitivities,
				PhenologicalStage.VERAISON,
				MAY,
			),
		).toBe(false);
	});

	test("falls back to the month window when the stage is unknown", () => {
		expect(isDiseaseActive(peronospora, sensitivities, null, MAY)).toBe(true);
		expect(isDiseaseActive(peronospora, sensitivities, null, SEPTEMBER)).toBe(
			false,
		);
	});

	test("falls back to the month window when the disease has no rows", () => {
		expect(
			isDiseaseActive(peronospora, [], PhenologicalStage.BUD_BREAK, MAY),
		).toBe(true);
	});

	test("is inactive without a month window or stage rows", () => {
		expect(
			isDiseaseActive(
				{ id: "x", sensitivityMonthMin: null, sensitivityMonthMax: null },
				[],
				null,
				MAY,
			),
		).toBe(false);
	});
});

describe("getSubstanceStageRisk", () => {
	const oidiumSensitivities = getStageSensitivityRows("Oidium").map((row) => ({
		...row,
		diseaseId: "oidium",
	}));
	const allSensitivities = [...sensitivities, ...oidiumSensitivities];

	test("is null when no parcel has a current stage", () => {
		expect(
			getSubstanceStageRisk([peronospora.id], [], allSensitivities),
		).toBeNull();
	});

	test("is null when the diseases have no rows", () => {
		expect(
			getSubstanceStageRisk(
				["other"],
				[{ stage: PhenologicalStage.FLOWERING }],
				allSensitivities,
			),
		).toBeNull();
	});

	test("flags High and Very high stages as critical", () => {
		expect(
			getSubstanceStageRisk(
				[peronospora.id],
				[{ stage: PhenologicalStage.FLOWERING }],
				allSensitivities,
			),
		).toEqual({
			stage: PhenologicalStage.FLOWERING,
			level: DiseaseSensitivityLevel.VERY_HIGH,
			isCritical: true,
			criticalDiseaseIds: [peronospora.id],
		});
		expect(
			getSubstanceStageRisk(
				[peronospora.id],
				[{ stage: PhenologicalStage.VERAISON }],
				allSensitivities,
			),
		).toEqual({
			stage: PhenologicalStage.VERAISON,
			level: DiseaseSensitivityLevel.LOW,
			isCritical: false,
			criticalDiseaseIds: [],
		});
	});

	test("lists every disease of the substance critical at the stage", () => {
		expect(
			getSubstanceStageRisk(
				[peronospora.id, "oidium"],
				[{ stage: PhenologicalStage.FLOWERING }],
				allSensitivities,
			)?.criticalDiseaseIds,
		).toEqual([peronospora.id, "oidium"]);
	});

	test("takes the riskiest disease of the substance", () => {
		// At bud break downy mildew is None but powdery mildew Low.
		expect(
			getSubstanceStageRisk(
				[peronospora.id, "oidium"],
				[{ stage: PhenologicalStage.BUD_BREAK }],
				allSensitivities,
			)?.level,
		).toBe(DiseaseSensitivityLevel.LOW);
	});

	test("takes the riskiest parcel stage, the latest observed on ties", () => {
		expect(
			getSubstanceStageRisk(
				[peronospora.id],
				[
					{ stage: PhenologicalStage.VERAISON },
					{ stage: PhenologicalStage.FLOWER_CLUSTERS },
					{ stage: PhenologicalStage.FLOWERING },
				],
				allSensitivities,
			)?.stage,
		).toBe(PhenologicalStage.FLOWERING);
		expect(
			getSubstanceStageRisk(
				[peronospora.id],
				[
					{ stage: PhenologicalStage.FRUIT_SET },
					{ stage: PhenologicalStage.FLOWERING },
				],
				allSensitivities,
			)?.stage,
		).toBe(PhenologicalStage.FRUIT_SET);
	});
});

describe("getDiseaseRiskTimeline", () => {
	test("is null when the disease has no matrix row", () => {
		expect(getDiseaseRiskTimeline("unknown", sensitivities)).toBeNull();
	});

	test("lists every stage in season order with its level", () => {
		const timeline = getDiseaseRiskTimeline(peronospora.id, sensitivities);
		expect(timeline?.map(({ stage }) => stage)).toEqual(PHENOLOGICAL_STAGES);
		expect(timeline?.[0].level).toBe(DiseaseSensitivityLevel.NONE);
		expect(
			timeline?.find(({ stage }) => stage === PhenologicalStage.FLOWERING)
				?.level,
		).toBe(DiseaseSensitivityLevel.VERY_HIGH);
	});
});
