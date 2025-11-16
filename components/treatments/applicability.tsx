import { getNext3DaysTreatmentApplicability } from "@/lib/applicability";
import { Badge } from "@/components/ui/badge";
import { tServer } from "@/lib/translations-server-only";
import { type Locale } from "@/lib/translations-helpers";

const Applicability = async ({
	parcelId,
	locale,
}: {
	parcelId: string;
	locale: Locale;
}) => {
	const next3DaysApplicability =
		await getNext3DaysTreatmentApplicability(parcelId);

	if (next3DaysApplicability.length === 0) {
		return null;
	}

	const dict = tServer(locale);
	const t = (key: string): string => {
		// @ts-expect-error: this type would be really complicated
		return key.split(".").reduce((obj, k) => obj?.[k], dict) || key;
	};

	const formatDate = (date: Date) => {
		return new Intl.DateTimeFormat(locale === "it" ? "it-IT" : "en-US", {
			weekday: "short",
			month: "short",
			day: "numeric",
		}).format(date);
	};

	return (
		<div>
			<h2 className="text-lg font-semibold mb-3 flex items-center">
				{t("treatments.applicability.title")}
			</h2>
			<div className="grid gap-4 md:grid-cols-3">
				{next3DaysApplicability.map((day, index) => (
					<div key={index} className="rounded-lg border p-4 space-y-2">
						<div className="flex items-center justify-between">
							<h3 className="font-semibold">{formatDate(day.date)}</h3>
							<Badge variant={day.applicable ? "default" : "destructive"}>
								{day.applicable
									? t("treatments.applicability.applicable")
									: t("treatments.applicability.notApplicable")}
							</Badge>
						</div>
						<div className="space-y-1 text-sm">
							<div className="flex justify-between">
								<span className="text-muted-foreground">
									{t("treatments.applicability.rain")}:
								</span>
								<span className="font-medium">
									{day.cumulativePrecipitation.toFixed(1)}{" "}
									{t("treatments.applicability.mm")}
								</span>
							</div>
							<div className="flex justify-between">
								<span className="text-muted-foreground">
									{t("treatments.applicability.avgWind")}:
								</span>
								<span className="font-medium">
									{day.averageWindSpeed.toFixed(1)}{" "}
									{t("treatments.applicability.kmh")}
								</span>
							</div>
						</div>
					</div>
				))}
			</div>
		</div>
	);
};

export default Applicability;
