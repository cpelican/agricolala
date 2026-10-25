import {
	ogImageAlt,
	ogImageContentType,
	ogImageSize,
	renderOgImage,
} from "@/components/site/og-image";
import { defaultLocale } from "@/lib/i18n/locale";

export const size = ogImageSize;
export const contentType = ogImageContentType;
export const alt = ogImageAlt;

// Links to app pages land on sign-in when unfurled (Slackbot has no session), so it
// needs a preview card too. Its URL has no locale: use the default one.
export default function OpenGraphImage() {
	return renderOgImage(defaultLocale);
}
