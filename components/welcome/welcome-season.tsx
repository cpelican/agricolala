import { StageIcon } from "@/components/phenology/stage-icon";
import { PHENOLOGICAL_STAGES } from "@/lib/phenology";
import type { TranslationType } from "@/lib/translations-server-only";
import { EXAMPLE_TREATMENTS_PER_STAGE } from "./example-data";
import { SECTION, SECTION_TEXT, SECTION_TITLE } from "./section-styles";

export function WelcomeSeason({ dict }: { dict: TranslationType }) {
	const t = dict.welcome.season;
	const treatmentsLabel = (count: number) => {
		if (count === 0) return t.noTreatment;
		if (count === 1) return t.oneTreatment;
		return t.manyTreatments.replace("{count}", String(count));
	};

	return (
		<section
			aria-labelledby="season-title"
			className={`${SECTION} flex flex-col gap-4 min-[900px]:gap-8`}
		>
			<div className="grid items-end gap-4 min-[900px]:grid-cols-2 min-[900px]:gap-6">
				<h2 id="season-title" className={SECTION_TITLE}>
					{t.title}
				</h2>
				<p className={`${SECTION_TEXT} max-w-[480px]`}>{t.description}</p>
			</div>

			<figure className="m-0 flex flex-col gap-4">
				<ol className="m-0 mt-2 list-none rounded-lg border border-neutral-200 bg-white px-4 py-1 min-[900px]:mt-0 min-[900px]:grid min-[900px]:grid-cols-8 min-[900px]:gap-2 min-[900px]:px-6 min-[900px]:pt-7 min-[900px]:pb-6">
					{PHENOLOGICAL_STAGES.map((stage) => {
						const count = EXAMPLE_TREATMENTS_PER_STAGE[stage];
						return (
							<li
								key={stage}
								className="grid min-h-16 grid-cols-[44px_1fr_auto] items-center gap-3.5 border-b border-neutral-200 last:border-b-0 min-[900px]:flex min-[900px]:flex-col min-[900px]:gap-2.5 min-[900px]:border-b-0 min-[900px]:text-center"
							>
								<StageIcon
									stage={stage}
									className="h-[43px] w-[38px] min-[900px]:h-[50px] min-[900px]:w-11"
								/>
								<span className="text-sm font-medium min-[900px]:min-h-8 min-[900px]:text-[13px] min-[900px]:leading-4">
									{dict.phenology.stages[stage].label}
								</span>
								<span
									className={`rounded-full px-2.5 py-[3px] text-xs font-medium whitespace-nowrap ${
										count === 0
											? "bg-neutral-100 text-neutral-600"
											: "bg-primary-50 text-primary-700"
									}`}
								>
									{treatmentsLabel(count)}
								</span>
							</li>
						);
					})}
				</ol>
				<figcaption className="text-xs text-muted-foreground">
					{t.caption}
				</figcaption>
			</figure>
		</section>
	);
}
