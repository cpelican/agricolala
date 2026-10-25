import {
	ogImageAlt,
	ogImageContentType,
	ogImageSize,
	renderOgImage,
} from "@/components/site/og-image";
import { languageIsLocale, defaultLocale } from "@/lib/i18n/locale";

export const size = ogImageSize;
export const contentType = ogImageContentType;
export const alt = ogImageAlt;

// Preview card when this page is shared (Slack, WhatsApp…). Kept next to the page:
// a page that sets its own openGraph drops images inherited from parent segments.
export default async function OpenGraphImage({
	params,
}: {
	params: Promise<{ lang: string }>;
}) {
	const { lang } = await params;

	return renderOgImage(languageIsLocale(lang) ? lang : defaultLocale);
}
