import { getDictionary } from "@/lib/i18n/dictionaries";
import { appLanguages } from "@/lib/i18n/locale";
import {
	GITHUB_REPOSITORY_URL,
	localizedPath,
	PUBLIC_PAGES,
	siteUrl,
	welcomePath,
} from "@/lib/site-url";

export const dynamic = "force-static";

const absolute = (path: string) => new URL(path, siteUrl).toString();

// Plain-text summary of the site for AI assistants (https://llmstxt.org), built from the
// welcome page copy so the two never drift apart.
export function GET() {
	const { welcome } = getDictionary(appLanguages.en);
	const { welcome: welcomeIt } = getDictionary(appLanguages.it);
	const languages = new Intl.ListFormat("en", { type: "conjunction" }).format(
		Object.values(appLanguages).map(
			(locale) =>
				new Intl.DisplayNames("en", { type: "language" }).of(locale) ?? locale,
		),
	);

	const body = `# Agricolala

> ${welcome.meta.description}

Agricolala is a free, open-source web app for winegrowers. In Italian it works as a "quaderno di campagna" (the vineyard treatment register). It works in ${languages}, in the browser, and is made for phones.

## What it does

- Map vineyard parcels on a map.
- Log every treatment (date, parcel, products, doses); each one is tagged with the vines' growth stage (BBCH).
- ${welcome.usage.description}
${welcome.app.features.map((feature) => `- ${feature.title}: ${feature.description}`).join("\n")}
- Export every treatment of the year to Excel.
- Share a parcel with other people.

## FAQ

${welcome.faq.items.map((item) => `### ${item.question}\n\n${item.answer}`).join("\n\n")}

## Pages

- [Welcome (English)](${absolute(welcomePath(appLanguages.en))}): ${welcome.meta.title}
- [Benvenuto (Italiano)](${absolute(welcomePath(appLanguages.it))}): ${welcomeIt.meta.title}
- [Privacy policy](${absolute(localizedPath(appLanguages.en, PUBLIC_PAGES.privacyPolicy))})
- [Terms of service](${absolute(localizedPath(appLanguages.en, PUBLIC_PAGES.termsOfService))})
- [Source code on GitHub](${GITHUB_REPOSITORY_URL})
`;

	return new Response(body, {
		headers: { "Content-Type": "text/plain; charset=utf-8" },
	});
}
