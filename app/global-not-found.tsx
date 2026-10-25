import type { Metadata } from "next";
import "./globals.css";
import { RootDocument, rootViewport } from "@/components/misc/root-document";
import { RouteErrorContent } from "@/components/misc/route-error-content";
import { siteUrl } from "@/lib/site-url";
import { defaultLocale } from "@/lib/i18n/locale";
import { tServer } from "@/lib/i18n/server";

const copy = tServer(defaultLocale).errors.notFound;

export const metadata: Metadata = {
	metadataBase: siteUrl,
	title: `${copy.title} · Agricolala`,
	robots: { index: false },
};
export const viewport = rootViewport;

// 404 for URLs that match no route. With two root layouts (app/[lang], app/auth) there is
// no single layout to render it in, so it brings its own document.
export default function GlobalNotFound() {
	return (
		<RootDocument lang={defaultLocale}>
			<main>
				<RouteErrorContent
					title={copy.title}
					description={copy.description}
					backHomeLabel={copy.backHome}
				/>
			</main>
		</RootDocument>
	);
}
