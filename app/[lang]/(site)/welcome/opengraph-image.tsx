import { ImageResponse } from "next/og";
import { languageIsLocale, defaultLocale } from "@/lib/i18n/locale";
import { tServer } from "@/lib/i18n/server";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Agricolala, your vineyard’s treatment notebook";

// Social preview: the hero headline on the same graph paper as the page.
export default async function OpenGraphImage({
	params,
}: {
	params: Promise<{ lang: string }>;
}) {
	const { lang } = await params;
	const locale = languageIsLocale(lang) ? lang : defaultLocale;
	const { hero } = tServer(locale).welcome;

	return new ImageResponse(
		<div
			style={{
				width: "100%",
				height: "100%",
				display: "flex",
				flexDirection: "column",
				justifyContent: "space-between",
				padding: 80,
				backgroundColor: "#fdfdf9",
				backgroundImage:
					"linear-gradient(rgba(161,200,171,0.25) 1px, transparent 1px), linear-gradient(90deg, rgba(161,200,171,0.25) 1px, transparent 1px)",
				backgroundSize: "32px 32px",
				fontFamily: "sans-serif",
			}}
		>
			<div
				style={{
					display: "flex",
					fontSize: 40,
					fontWeight: 700,
					color: "#004b14",
				}}
			>
				Agricolala
			</div>
			<div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
				<div
					style={{
						display: "flex",
						fontSize: 76,
						lineHeight: 1.05,
						fontWeight: 700,
						letterSpacing: "-0.03em",
						color: "#004b14",
						maxWidth: 900,
					}}
				>
					{`${hero.titleStart} ${hero.titleHighlight}`}
				</div>
				<div style={{ display: "flex", fontSize: 32, color: "#4d4d4d" }}>
					{hero.lead}
				</div>
			</div>
		</div>,
		size,
	);
}
