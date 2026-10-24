import { PhenologicalStage } from "@prisma/client";
import type { Locale } from "@/lib/translations-helpers";

// Figures of the example vineyard shown on the welcome page (illustrative, not real user data).
export const EXAMPLE_COPPER = {
	usedKgPerHa: 2.9,
	limitKgPerHa: 4,
	productAppliedKg: 11.6,
} as const;

export const EXAMPLE_COPPER_PERCENT = Math.round(
	(EXAMPLE_COPPER.usedKgPerHa / EXAMPLE_COPPER.limitKgPerHa) * 100,
);

// Treatments made at each stage of the example season.
export const EXAMPLE_TREATMENTS_PER_STAGE = {
	[PhenologicalStage.BUD_BREAK]: 0,
	[PhenologicalStage.LEAVES_UNFOLDING]: 1,
	[PhenologicalStage.FLOWER_CLUSTERS]: 2,
	[PhenologicalStage.FLOWERING]: 2,
	[PhenologicalStage.FRUIT_SET]: 3,
	[PhenologicalStage.BUNCH_CLOSURE]: 2,
	[PhenologicalStage.VERAISON]: 1,
	[PhenologicalStage.RIPE]: 0,
} satisfies Record<PhenologicalStage, number>;

export const formatNumber = (locale: Locale, value: number) =>
	new Intl.NumberFormat(locale).format(value);
