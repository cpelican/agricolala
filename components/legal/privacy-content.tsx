import {
	type LegalDictionary,
	type LegalHeadingLevel,
	type LegalSection,
	LegalSections,
} from "./legal-sections";

export function PrivacyContent({
	legal,
	headingLevel,
}: {
	legal: LegalDictionary;
	headingLevel: LegalHeadingLevel;
}) {
	const { sections } = legal.privacy;
	const privacySections: LegalSection[] = [
		sections.information,
		sections.usage,
		sections.sharing,
		sections.security,
		sections.retention,
		sections.rights,
		sections.cookies,
		sections.children,
		sections.international,
		sections.changes,
		sections.contact,
	];

	return (
		<LegalSections sections={privacySections} headingLevel={headingLevel} />
	);
}
