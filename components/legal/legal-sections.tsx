import type { TranslationType } from "@/lib/translations-server-only";

export type LegalDictionary = TranslationType["legal"];

export type LegalSection = {
	title: string;
	content: string | readonly string[];
	listItems?: readonly string[];
	additionalContent?: string;
};

// Section headings sit under the page title (h2) on the legal pages, and under the
// "Terms of Service" / "Privacy Policy" headings (h4) in the acceptance dialog.
export type LegalHeadingLevel = "h2" | "h4";

const paragraphsOf = (content: LegalSection["content"]) =>
	typeof content === "string" ? [content] : content;

// Renders translated legal sections. No hooks, so it renders on the server for the public
// pages and on the client inside the acceptance dialog.
export function LegalSections({
	sections,
	headingLevel,
}: {
	sections: readonly LegalSection[];
	headingLevel: LegalHeadingLevel;
}) {
	const Heading = headingLevel;

	return (
		<div className="space-y-6">
			{sections.map((section) => (
				<section key={section.title} className="space-y-3">
					<Heading className="text-lg font-semibold text-gray-900">
						{section.title}
					</Heading>
					<div className="space-y-3">
						{paragraphsOf(section.content).map((paragraph) => (
							<p key={paragraph} className="text-gray-700 leading-relaxed">
								{paragraph}
							</p>
						))}
						{section.listItems && (
							<ul className="list-disc pl-6 space-y-2 text-gray-700">
								{section.listItems.map((item) => (
									<li key={item} className="leading-relaxed">
										{item}
									</li>
								))}
							</ul>
						)}
						{section.additionalContent && (
							<p className="text-gray-700 leading-relaxed">
								{section.additionalContent}
							</p>
						)}
					</div>
				</section>
			))}
		</div>
	);
}
