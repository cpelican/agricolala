import { differenceInCalendarDays } from "date-fns";

// "Set today" / "Set yesterday" / "Set 5 days ago" for an observation date.
export function formatStageSetAgo(
	t: (key: string) => string,
	observedAt: Date,
	now: Date,
): string {
	const days = differenceInCalendarDays(now, observedAt);
	if (days <= 0) {
		return t("phenology.setToday");
	}
	if (days === 1) {
		return t("phenology.setYesterday");
	}
	return t("phenology.setDaysAgo").replace("{days}", String(days));
}
