import Image from "next/image";
import { CalendarDays, TriangleAlert } from "lucide-react";
import type { TranslationType } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/locale";
import {
	EXAMPLE_COPPER,
	EXAMPLE_COPPER_PERCENT,
	formatNumber,
} from "./example-data";
import {
	EYEBROW,
	SECTION,
	SECTION_TEXT,
	SECTION_TITLE,
} from "./section-styles";
import styles from "@/components/site/site.module.css";

export function WelcomeApp({ dict }: { dict: TranslationType }) {
	const t = dict.welcome.app;

	return (
		<section aria-labelledby="app-title" className={SECTION}>
			<div className="grid items-center gap-4 min-[900px]:grid-cols-[repeat(auto-fit,minmax(260px,1fr))] min-[900px]:gap-12">
				<div className="flex max-w-[380px] flex-col gap-4">
					<p className={`m-0 ${EYEBROW}`}>{t.eyebrow}</p>
					<h2 id="app-title" className={SECTION_TITLE}>
						{t.title}
					</h2>
					<p className={SECTION_TEXT}>{t.description}</p>
				</div>
				<div className="relative my-4 justify-self-center min-[900px]:my-0">
					<div
						aria-hidden="true"
						className={`${styles.blob} top-[12%] -left-[18%] h-[78%] w-[136%] min-[900px]:top-[10%] min-[900px]:-left-[22%] min-[900px]:h-[80%] min-[900px]:w-[144%]`}
					/>
					<div className="relative w-[250px] rounded-[40px] bg-[#141414] p-2.5 shadow-lg min-[900px]:w-[300px] min-[900px]:rounded-[48px] min-[900px]:p-3">
						<Image
							src="/welcome/app-dashboard-2026-10.webp"
							alt={t.imageAlt}
							width={750}
							height={1624}
							sizes="(min-width: 900px) 276px, 230px"
							className="block h-auto w-full rounded-[30px] min-[900px]:rounded-[36px]"
						/>
					</div>
				</div>
				<ul className="m-0 flex max-w-[320px] list-none flex-col gap-4 p-0 min-[900px]:gap-6">
					{t.features.map((feature) => (
						<li key={feature.title} className="flex flex-col gap-1">
							<h3 className="m-0 text-base font-semibold">{feature.title}</h3>
							<p className="m-0 text-sm text-muted-foreground">
								{feature.description}
							</p>
						</li>
					))}
				</ul>
			</div>
		</section>
	);
}

export function WelcomeUsage({
	dict,
	locale,
}: {
	dict: TranslationType;
	locale: Locale;
}) {
	const t = dict.welcome.usage;
	const used = formatNumber(locale, EXAMPLE_COPPER.usedKgPerHa);
	const limit = formatNumber(locale, EXAMPLE_COPPER.limitKgPerHa);
	const limitUsed = t.limitUsed.replace(
		"{percent}",
		String(EXAMPLE_COPPER_PERCENT),
	);

	return (
		<section aria-labelledby="usage-title" className={SECTION}>
			<div className="grid items-center gap-4 min-[900px]:grid-cols-2 min-[900px]:gap-12">
				<div className="flex max-w-[480px] flex-col gap-4">
					<p className={`m-0 ${EYEBROW}`}>{t.eyebrow}</p>
					<h2 id="usage-title" className={SECTION_TITLE}>
						{t.title}
					</h2>
					<p className={SECTION_TEXT}>{t.description}</p>
				</div>

				<article
					aria-labelledby="usage-card-title"
					className="mt-2 flex flex-col gap-3.5 rounded-lg border border-neutral-200 bg-white p-5 shadow-xs min-[900px]:mt-0 min-[900px]:p-6"
				>
					<div className="flex items-center gap-2.5">
						<span
							aria-hidden="true"
							className="size-3 rounded-full bg-[hsl(173_58%_39%)]"
						/>
						<h3 id="usage-card-title" className="m-0 text-lg font-semibold">
							{dict.substances.copper}
						</h3>
						<span className="ml-auto text-xs text-muted-foreground">
							{t.exampleVineyard}
						</span>
					</div>
					<div>
						<span className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">
							<TriangleAlert aria-hidden="true" className="size-3" />
							{dict.diseases.peronospora}
						</span>
					</div>
					<div className="flex flex-col gap-3 border-t border-neutral-200 pt-3.5">
						<div className="flex items-center gap-2">
							<CalendarDays aria-hidden="true" className="size-4" />
							<h4 className="m-0 text-sm font-semibold">{t.usedThisYear}</h4>
						</div>
						<dl className="m-0 grid grid-cols-2 gap-3">
							<div className="rounded-lg bg-neutral-100 px-3.5 py-3">
								<dt className="text-xs text-neutral-600">{t.productApplied}</dt>
								<dd className="m-0 text-[22px] leading-7 font-bold tabular-nums">
									{formatNumber(locale, EXAMPLE_COPPER.productAppliedKg)} kg
								</dd>
							</div>
							<div className="rounded-lg bg-neutral-100 px-3.5 py-3">
								<dt className="text-xs text-neutral-600">
									{t.activeSubstance}
								</dt>
								<dd className="m-0 text-[22px] leading-7 font-bold tabular-nums">
									{used} kg/ha
								</dd>
							</div>
						</dl>
						<div
							role="meter"
							aria-label={t.meterLabel}
							aria-valuemin={0}
							aria-valuemax={EXAMPLE_COPPER.limitKgPerHa}
							aria-valuenow={EXAMPLE_COPPER.usedKgPerHa}
							aria-valuetext={`${used} kg/ha, ${limitUsed}`}
							className="h-2.5 overflow-hidden rounded-full bg-neutral-200"
						>
							<div
								className="h-full rounded-full bg-[hsl(173_58%_39%)]"
								style={{ width: `${EXAMPLE_COPPER_PERCENT}%` }}
							/>
						</div>
						<div className="flex justify-between gap-2 text-xs">
							<span aria-hidden="true" className="text-muted-foreground">
								0
							</span>
							<span className="font-medium text-[hsl(173_58%_26%)]">
								{limitUsed}
							</span>
							<span className="text-muted-foreground">
								{t.limitMax.replace("{max}", limit)}
							</span>
						</div>
					</div>
				</article>
			</div>
		</section>
	);
}
