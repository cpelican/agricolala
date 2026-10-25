import Link from "next/link";
import { ArrowRight, Code } from "lucide-react";
import { GITHUB_REPOSITORY_URL } from "@/lib/site-url";
import type { TranslationType } from "@/lib/i18n/dictionaries";
import {
	EYEBROW,
	PRIMARY_BUTTON,
	PRIMARY_BUTTON_ARROW,
	SECTION,
	SECTION_TEXT,
	SECTION_TITLE,
} from "./section-styles";

export function WelcomeOpenSource({ dict }: { dict: TranslationType }) {
	const t = dict.welcome.openSource;

	return (
		<section aria-labelledby="open-source-title" className={SECTION}>
			<div className="flex max-w-[600px] flex-col gap-4">
				<p className={`m-0 ${EYEBROW}`}>{t.eyebrow}</p>
				<h2 id="open-source-title" className={SECTION_TITLE}>
					{t.title}
				</h2>
				<p className={SECTION_TEXT}>{t.description}</p>
				<a
					href={GITHUB_REPOSITORY_URL}
					className="inline-flex min-h-11 items-center gap-2 self-start text-[15px] leading-5 font-medium text-primary underline underline-offset-2 hover:text-primary-600"
				>
					<Code aria-hidden="true" className="size-[18px]" />
					{t.github}
				</a>
			</div>
		</section>
	);
}

export function WelcomeCallToAction({ dict }: { dict: TranslationType }) {
	const t = dict.welcome.closing;

	return (
		<section
			aria-labelledby="closing-title"
			className="mx-auto max-w-[1200px] px-4 pt-16 pb-10 min-[900px]:px-6 min-[900px]:pt-24 min-[900px]:pb-14"
		>
			<div className="flex flex-col items-start gap-4 min-[900px]:flex-row min-[900px]:flex-wrap min-[900px]:items-center min-[900px]:justify-between min-[900px]:gap-x-8 min-[900px]:border-t min-[900px]:border-neutral-200 min-[900px]:pt-8">
				<h2
					id="closing-title"
					className="m-0 text-[22px] leading-[30px] font-semibold tracking-[-0.01em] text-primary-700 min-[900px]:text-2xl"
				>
					{t.title}
				</h2>
				<Link href="/auth/signin" className={PRIMARY_BUTTON}>
					{t.cta}
					<ArrowRight aria-hidden="true" className={PRIMARY_BUTTON_ARROW} />
				</Link>
			</div>
		</section>
	);
}
