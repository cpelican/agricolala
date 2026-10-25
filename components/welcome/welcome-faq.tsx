import { ChevronDown } from "lucide-react";
import type { TranslationType } from "@/lib/i18n/dictionaries";
import { SECTION, SECTION_TEXT, SECTION_TITLE } from "./section-styles";

// Answers stay in the HTML when closed, so search engines and AI assistants read them too.
export function WelcomeFaq({ dict }: { dict: TranslationType }) {
	const t = dict.welcome.faq;

	return (
		<section aria-labelledby="faq-title" className={SECTION}>
			<div className="flex max-w-[720px] flex-col gap-6">
				<h2 id="faq-title" className={SECTION_TITLE}>
					{t.title}
				</h2>
				<div className="flex flex-col border-t border-neutral-200">
					{t.items.map((item) => (
						<details
							key={item.question}
							className="group border-b border-neutral-200"
						>
							<summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 py-4 text-base font-medium text-neutral-950 [&::-webkit-details-marker]:hidden">
								{item.question}
								<ChevronDown
									aria-hidden="true"
									className="size-5 flex-none text-primary-700 transition-transform group-open:rotate-180"
								/>
							</summary>
							<p className={`${SECTION_TEXT} pb-4`}>{item.answer}</p>
						</details>
					))}
				</div>
			</div>
		</section>
	);
}
