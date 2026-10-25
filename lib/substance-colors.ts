// One colour per substance, used everywhere it appears (substance cards, treatment
// cards, Chart.js charts). Each one is a --chart-* token of app/globals.css; the
// values are written out because Chart.js draws on a canvas, which cannot read CSS
// variables. Keyed by the substance names of prisma/seed.ts.
const SUBSTANCE_COLORS = new Map<string, { color: string; ink: string }>([
	// --chart-2 (teal); ink is a darker teal for text on white.
	["Copper", { color: "hsl(173 58% 39%)", ink: "hsl(173 58% 24%)" }],
	// --chart-4 (sand yellow)
	["Sulfur", { color: "hsl(43 74% 66%)", ink: "hsl(40 80% 28%)" }],
	// --chart-5 (orange)
	[
		"Olio essenziale di arancio dolce",
		{ color: "hsl(27 87% 67%)", ink: "hsl(24 80% 32%)" },
	],
]);

// Colour of a substance with no colour of its own (neutral-400).
export const SUBSTANCE_FALLBACK_COLOR = "hsl(0 0% 64%)";
// Text colour for a substance with no colour of its own (neutral-600).
const SUBSTANCE_FALLBACK_INK = "hsl(0 0% 32%)";

export function getSubstanceColor(substanceName: string) {
	return SUBSTANCE_COLORS.get(substanceName)?.color ?? SUBSTANCE_FALLBACK_COLOR;
}

// Darker shade of the substance colour, readable as text on white (4.5:1 or more).
export function getSubstanceInk(substanceName: string) {
	return SUBSTANCE_COLORS.get(substanceName)?.ink ?? SUBSTANCE_FALLBACK_INK;
}
