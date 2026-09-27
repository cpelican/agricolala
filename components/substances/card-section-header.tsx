import { FlaskConical, type LucideIcon } from "lucide-react";
import { useTranslations } from "@/contexts/translations-context";

// Title row shared by the substance card's sections, so "protection now" and
// "used this year" read as clearly separate questions.
export function CardSectionHeader({
	icon: Icon,
	title,
	subtitle,
	experimental = false,
}: {
	icon: LucideIcon;
	title: string;
	subtitle?: string;
	experimental?: boolean;
}) {
	const { t } = useTranslations();
	return (
		<div className="space-y-0.5">
			<div className="flex flex-wrap items-center gap-x-2 gap-y-1">
				<h4 className="flex items-center gap-1.5 text-sm font-semibold">
					<Icon className="h-4 w-4 text-muted-foreground" aria-hidden />
					{title}
				</h4>
				{experimental && (
					<span className="inline-flex items-center gap-1 rounded-full border border-purple-200 bg-purple-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-purple-700">
						<FlaskConical className="h-3 w-3" aria-hidden />
						{t("coverage.experimental")}
					</span>
				)}
			</div>
			{subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
		</div>
	);
}
