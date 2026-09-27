import { type LucideIcon } from "lucide-react";

// Title row shared by the substance card's sections, so "protection now" and
// "used this year" read as clearly separate questions.
export function CardSectionHeader({
	icon: Icon,
	title,
	subtitle,
}: {
	icon: LucideIcon;
	title: string;
	subtitle?: string;
}) {
	return (
		<div className="space-y-0.5">
			<h4 className="flex items-center gap-1.5 text-sm font-semibold">
				<Icon className="h-4 w-4 text-muted-foreground" aria-hidden />
				{title}
			</h4>
			{subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
		</div>
	);
}
