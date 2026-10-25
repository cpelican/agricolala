import { type LucideIcon } from "lucide-react";
import { ExperimentalLabel } from "./disease-badges";

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
	return (
		<div className="space-y-0.5">
			<div className="flex flex-wrap items-center gap-x-2 gap-y-1">
				<h4 className="flex items-center gap-1.5 text-sm font-semibold">
					<Icon className="h-4 w-4 text-muted-foreground" aria-hidden />
					{title}
				</h4>
				{experimental && <ExperimentalLabel />}
			</div>
			{subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
		</div>
	);
}
