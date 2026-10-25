import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Download, FileSpreadsheet, Droplet } from "lucide-react";
import type { Locale } from "@/lib/i18n/locale";
import {
	EXAMPLE_COPPER,
	EXAMPLE_COPPER_PERCENT,
	formatNumber,
} from "./example-data";
import { PRIMARY_BUTTON, PRIMARY_BUTTON_ARROW } from "./section-styles";
import type { WelcomeDictionary } from "./types";
import styles from "@/components/site/site.module.css";

const CARD =
	"rounded-lg border border-neutral-200 bg-white shadow-md flex items-center gap-2.5 px-3 py-2.5 min-[900px]:gap-3 min-[900px]:px-3.5 min-[900px]:py-3";
const ICON_TILE =
	"flex size-8 flex-none items-center justify-center rounded-md bg-primary-50 text-primary-700 min-[900px]:size-10";
const CARD_TITLE = "text-[13px] leading-[18px] font-medium min-[900px]:text-sm";
const CARD_META = "text-xs text-muted-foreground";

export function WelcomeHero({
	locale,
	t,
}: {
	locale: Locale;
	t: WelcomeDictionary;
}) {
	const copperUsed = `${formatNumber(locale, EXAMPLE_COPPER.usedKgPerHa)} kg/ha`;
	const limitUsed = t.usage.limitUsed.replace(
		"{percent}",
		String(EXAMPLE_COPPER_PERCENT),
	);
	const year = new Date().getFullYear();

	return (
		<section aria-labelledby="hero-title" className={styles.hero}>
			<div className={styles.backdrop} aria-hidden="true" />
			<div className={styles.stage}>
				<div className={styles.intro}>
					<h1
						id="hero-title"
						className={`${styles.title} mt-2 mb-0 text-[34px] leading-[1.05] font-bold tracking-[-0.03em] text-primary-700 min-[900px]:mt-0 min-[900px]:text-[clamp(40px,4.6vw,60px)] min-[900px]:leading-[1.02]`}
					>
						{t.hero.titleStart}{" "}
						<span className={styles.inkword}>{t.hero.titleHighlight}</span>
					</h1>
					<div
						className={`${styles.body} flex flex-col gap-4 min-[900px]:gap-5`}
					>
						<p className="m-0 text-base text-neutral-700 min-[900px]:text-lg min-[900px]:leading-7">
							{t.hero.lead}
						</p>
						<div className="flex flex-col items-start gap-3 pt-1">
							<Link href="/auth/signin" className={PRIMARY_BUTTON}>
								{t.hero.cta}
								<ArrowRight
									aria-hidden="true"
									className={PRIMARY_BUTTON_ARROW}
								/>
							</Link>
							<p className="m-0 text-[13px] leading-5 text-neutral-600">
								{t.hero.note}
							</p>
						</div>
					</div>
				</div>

				{/* Illustration of the app: everything it says is also said in the page text. */}
				<div className={styles.art} aria-hidden="true">
					<div className={styles.leafBox}>
						<div className={styles.leafWash} />
						<div className={styles.leaf}>
							<Image
								src="/welcome/vine-leaf.webp"
								alt=""
								fill
								preload
								sizes="(min-width: 900px) 600px, 270px"
								className="object-contain"
							/>
							<span className={`${styles.tape} ${styles.tapeTop}`} />
							<span className={`${styles.tape} ${styles.tapeBottom}`} />
						</div>
					</div>

					<div className={`${styles.card} ${styles.cardParcel} ${CARD}`}>
						<svg
							width="48"
							height="40"
							viewBox="0 0 48 40"
							className="h-8 w-9 flex-none min-[900px]:h-10 min-[900px]:w-12"
						>
							<rect width="48" height="40" rx="6" fill="#3f5a36" />
							<path
								d="M0,26 C12,22 22,30 48,20"
								stroke="#56724a"
								strokeWidth="5"
								fill="none"
							/>
							<path
								d="M30,0 C34,14 40,26 38,40"
								stroke="#9aa39a"
								strokeWidth="2.5"
								fill="none"
							/>
							<polygon
								points="8,30 14,9 33,6 41,20 30,34"
								fill="hsl(98 100% 41% / 0.3)"
								stroke="hsl(98 100% 41%)"
								strokeWidth="1.6"
								strokeLinejoin="round"
							/>
						</svg>
						<div className="flex min-w-0 flex-col">
							<span className={CARD_TITLE}>{t.illustration.parcelName}</span>
							<span className={CARD_META}>{t.illustration.parcelMeta}</span>
						</div>
					</div>

					<div className={`${styles.card} ${styles.cardTreatment} ${CARD}`}>
						<span className={ICON_TILE}>
							<Droplet className="size-[18px] min-[900px]:size-5" />
						</span>
						<div className="flex min-w-0 flex-1 flex-col">
							<span className={CARD_TITLE}>{t.illustration.treatmentName}</span>
							<span className={CARD_META}>
								{t.illustration.treatmentTarget}
							</span>
						</div>
						<span
							className={`hidden flex-none rounded-full min-[900px]:inline bg-primary-50 px-2 py-0.5 text-xs font-medium text-primary-700`}
						>
							{t.illustration.done}
						</span>
					</div>

					<div
						className={`${styles.card} ${styles.cardCopper} flex flex-col gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-2.5 shadow-md min-[900px]:gap-2 min-[900px]:px-4 min-[900px]:py-3.5`}
					>
						<div className="flex items-center gap-1.5 min-[900px]:gap-2">
							<span className="size-2 rounded-full bg-[hsl(173_58%_39%)] min-[900px]:size-2.5" />
							<span className="text-[13px] leading-[18px] font-semibold min-[900px]:text-sm">
								{t.illustration.copper}
							</span>
							<span className="ml-auto text-xs font-semibold tabular-nums min-[900px]:hidden">
								{copperUsed}
							</span>
							<span
								className={`hidden ml-auto min-[900px]:inline ${CARD_META}`}
							>
								{t.illustration.usedThisYear}
							</span>
						</div>
						<div className="hidden items-baseline gap-1.5 min-[900px]:flex">
							<span className="text-xl leading-7 font-bold tabular-nums">
								{copperUsed}
							</span>
							<span className={CARD_META}>
								{t.illustration.activeSubstance}
							</span>
						</div>
						<div className="h-1.5 overflow-hidden rounded-full bg-neutral-200 min-[900px]:h-2">
							<div
								className="h-full rounded-full bg-[hsl(173_58%_39%)]"
								style={{ width: `${EXAMPLE_COPPER_PERCENT}%` }}
							/>
						</div>
						<div className="flex justify-between gap-2 text-xs">
							<span className="font-medium text-[hsl(173_58%_26%)]">
								{limitUsed}
							</span>
							<span className="hidden text-muted-foreground min-[900px]:inline">
								{t.usage.limitMax.replace(
									"{max}",
									formatNumber(locale, EXAMPLE_COPPER.limitKgPerHa),
								)}
							</span>
						</div>
					</div>

					<div className={`${styles.card} ${styles.cardExport} ${CARD}`}>
						<span className={ICON_TILE}>
							<FileSpreadsheet className="size-[18px] min-[900px]:size-5" />
						</span>
						<div className="flex min-w-0 flex-1 flex-col">
							<span className={`${CARD_TITLE} min-[900px]:hidden`}>
								{t.illustration.exportTitle}
							</span>
							<span
								className={`${CARD_TITLE} hidden whitespace-nowrap min-[900px]:inline`}
							>
								treatments-{year}.xlsx
							</span>
							<span className={CARD_META}>{t.illustration.exportMeta}</span>
						</div>
						<Download className="hidden size-[18px] flex-none text-primary min-[900px]:block" />
					</div>
				</div>
			</div>
			<div className={styles.bleed} aria-hidden="true">
				<div className={styles.bleedWash} />
				<div className={styles.bleedEdge} />
			</div>
		</section>
	);
}
