import {
	type LegalDictionary,
	type LegalHeadingLevel,
	type LegalSection,
	LegalSections,
} from "./legal-sections";

export function TosContent({
	legal,
	headingLevel,
}: {
	legal: LegalDictionary;
	headingLevel: LegalHeadingLevel;
}) {
	const { sections } = legal.tos;
	const tosSections: LegalSection[] = [
		sections.acceptance,
		sections.description,
		sections.responsibilities,
		sections.compliance,
		sections.dataOwnership,
		sections.liability,
	];

	return <LegalSections sections={tosSections} headingLevel={headingLevel} />;
}
