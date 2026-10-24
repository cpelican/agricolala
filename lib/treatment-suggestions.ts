import {
	DiseaseSensitivityLevel,
	PhenologicalStage,
	type DiseaseStageSensitivity,
	type Prisma,
	type Substance,
} from "@prisma/client";
import { DEFAULT_DAYS_BETWEEN_APPLICATIONS } from "./coverage-helpers";
import { getSensitivityLevel } from "./disease-stage-sensitivity";
import { getNextStage } from "./phenology";

// In a critical cadence the suggestion must be done within this many days of its
// start, instead of a whole extra interval.
export const CRITICAL_SUGGESTION_WINDOW_DAYS = 3;

const MS_PER_DAY = 1000 * 60 * 60 * 24;

// A product's substances, enough to tell whether it is restricted at flowering.
export const productFloweringSelect = {
	select: { substance: { select: { restrictedAtFlowering: true } } },
} satisfies Prisma.Product$compositionArgs;

// Last treatment of a parcel, as the suggest-treatments cron reads it.
export const lastTreatmentSelect = {
	id: true,
	appliedDate: true,
	waterDose: true,
	diseaseIds: true,
	productApplications: {
		select: {
			dose: true,
			product: {
				select: {
					id: true,
					daysBetweenApplications: true,
					composition: productFloweringSelect,
				},
			},
		},
	},
} satisfies Prisma.TreatmentSelect;

type LastTreatment = Prisma.TreatmentGetPayload<{
	select: typeof lastTreatmentSelect;
}>;

// Products with a substance best avoided while the vines flower (copper, as good
// practice; insecticides and acaricides, banned from flower opening to petal fall by
// L. 313/2004) are not suggested then. Flowering lasts only a few days.
export function isProductAllowedAtStage(
	product: {
		composition: { substance: Pick<Substance, "restrictedAtFlowering"> }[];
	},
	stage: PhenologicalStage | null,
): boolean {
	return !(
		stage === PhenologicalStage.FLOWERING &&
		product.composition.some(({ substance }) => substance.restrictedAtFlowering)
	);
}

// Tighter cadence when one of the diseases is Very high at the parcel's stage, or will
// be at the next one, so the last spray lands just before flowering starts.
export function isCriticalCadence(
	diseaseIds: string[],
	stage: PhenologicalStage | null,
	sensitivities: Pick<
		DiseaseStageSensitivity,
		"diseaseId" | "stage" | "level"
	>[],
): boolean {
	if (!stage) return false;
	const stages = [stage, getNextStage(stage)].filter((s) => s !== null);
	return diseaseIds.some((diseaseId) =>
		stages.some(
			(s) =>
				getSensitivityLevel(sensitivities, diseaseId, s) ===
				DiseaseSensitivityLevel.VERY_HIGH,
		),
	);
}

function addDays(date: Date, days: number): Date {
	const result = new Date(date);
	result.setDate(result.getDate() + days);
	return result;
}

// Next treatment to suggest for a parcel, from its last one: the products used then
// that target a disease still active at the parcel's stage (or month, without a
// stage), and are allowed at that stage. Each product comes back once its label
// interval has elapsed; in a critical cadence all of them come back at the shortest
// interval. Null when nothing is due.
export function buildTreatmentSuggestion({
	lastTreatment,
	date,
	stage,
	activeDiseaseIds,
	productIdsByDiseaseId,
	sensitivities,
}: {
	lastTreatment: LastTreatment;
	date: Date;
	stage: PhenologicalStage | null;
	activeDiseaseIds: Set<string>;
	productIdsByDiseaseId: Record<string, Set<string>>;
	sensitivities: Pick<
		DiseaseStageSensitivity,
		"diseaseId" | "stage" | "level"
	>[];
}) {
	const { appliedDate } = lastTreatment;
	if (!appliedDate) return null;

	const diseaseIds = lastTreatment.diseaseIds.filter((id) =>
		activeDiseaseIds.has(id),
	);
	const validProductIds = new Set(
		diseaseIds.flatMap((id) => [...(productIdsByDiseaseId[id] ?? [])]),
	);
	// Only products the grower already used: several products fight each disease and it
	// is not for the app to choose. Products without a label interval (e.g. liquid
	// products) use the same fallback as the coverage widget.
	const candidates = lastTreatment.productApplications
		.filter(
			({ product }) =>
				validProductIds.has(product.id) &&
				isProductAllowedAtStage(product, stage),
		)
		.map(({ dose, product }) => ({
			dose,
			productId: product.id,
			daysBetweenApplications:
				product.daysBetweenApplications ?? DEFAULT_DAYS_BETWEEN_APPLICATIONS,
		}));
	if (candidates.length === 0) return null;

	const daysSinceLastTreatment = Math.floor(
		(date.getTime() - appliedDate.getTime()) / MS_PER_DAY,
	);
	const isCritical = isCriticalCadence(diseaseIds, stage, sensitivities);
	const shortestInterval = Math.min(
		...candidates.map((c) => c.daysBetweenApplications),
	);
	const due = candidates.filter(
		(c) =>
			daysSinceLastTreatment >=
			(isCritical ? shortestInterval : c.daysBetweenApplications),
	);
	if (due.length === 0) return null;

	const interval = Math.min(...due.map((c) => c.daysBetweenApplications));
	const dateMin = addDays(appliedDate, interval);
	return {
		dateMin,
		dateMax: addDays(
			dateMin,
			isCritical ? CRITICAL_SUGGESTION_WINDOW_DAYS : interval,
		),
		diseaseIds,
		isCritical,
		productApplications: due.map(({ dose, productId }) => ({
			dose,
			productId,
		})),
	};
}
