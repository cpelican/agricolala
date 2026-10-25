"use client";

import { type Disease, TreatmentStatus } from "@prisma/client";
import { Calendar, Droplet, Droplets, MapPin } from "lucide-react";
import { Card } from "../ui/card";
import { type TreatmentType } from "@/lib/data-fetcher";
import { SubstanceCircle } from "../substances/substance-circle";
import { useSubstances } from "@/contexts/cached-data-context";
import { useTranslations } from "@/contexts/translations-context";
import { DeleteTreatmentButton } from "./delete-treatment-button";

type CardTreatment = Pick<
	TreatmentType,
	| "id"
	| "diseaseIds"
	| "status"
	| "dateMin"
	| "dateMax"
	| "appliedDate"
	| "productApplications"
	| "waterDose"
	| "user"
>;
type CardProduct = CardTreatment["productApplications"][number]["product"];

// Some catalogue products repeat the brand in their name ("OxyFlow OxyFlow"):
// print the brand only when the name does not already carry it.
function productLabel(product: Pick<CardProduct, "brand" | "name">) {
	const brand = product.brand.trim();
	const name = product.name.trim();
	if (!brand || name.toLowerCase().includes(brand.toLowerCase())) return name;
	return `${brand} ${name}`;
}

function useTreatmentDate(
	treatment: Pick<
		CardTreatment,
		"status" | "dateMin" | "dateMax" | "appliedDate"
	>,
) {
	const { t, locale } = useTranslations();
	const day = new Intl.DateTimeFormat(locale, {
		day: "numeric",
		month: "short",
		year: "numeric",
	});

	if (treatment.status === TreatmentStatus.DONE && treatment.appliedDate) {
		return day.format(new Date(treatment.appliedDate));
	}
	if (treatment.dateMin) {
		const start = new Date(treatment.dateMin);
		if (!treatment.dateMax) {
			return t("treatments.card.from").replace("{date}", day.format(start));
		}
		return day.formatRange(start, new Date(treatment.dateMax));
	}
	return null;
}

export function TreatmentCard({
	parcelName,
	treatment,
	diseases,
	currentUserId,
}: {
	parcelName: string;
	treatment: CardTreatment;
	diseases: Pick<Disease, "id" | "name">[];
	currentUserId: string;
}) {
	const { t, locale, getSubstanceTranslation } = useTranslations();
	const substances = useSubstances();
	const formattedDate = useTreatmentDate(treatment);
	const isDone = treatment.status === TreatmentStatus.DONE;
	// Only the author deletes a treatment (D2). Another member's done treatment shows
	// who recorded it (D1); suggested TODOs carry no author label.
	const isOwn = treatment.user.id === currentUserId;
	const authorLabel =
		!isOwn && isDone
			? t("treatments.card.by").replace(
					"{author}",
					treatment.user.name || treatment.user.email,
				)
			: null;
	const listFormat = new Intl.ListFormat(locale, { type: "conjunction" });
	const numberFormat = new Intl.NumberFormat(locale, {
		maximumFractionDigits: 1,
	});

	const diseaseLabels = treatment.diseaseIds.flatMap((diseaseId) => {
		const name = diseases.find((disease) => disease.id === diseaseId)?.name;
		if (!name) return [];
		const key = `diseases.${name.toLowerCase()}`;
		const label = t(key);
		return [label === key ? name : label];
	});
	const productNames = treatment.productApplications.map((application) =>
		productLabel(application.product),
	);
	const title =
		productNames.length > 0
			? listFormat.format(productNames)
			: t("treatments.card.untitled");

	// Each substance once, even when several products share it.
	const substanceIds = [
		...new Set(
			treatment.productApplications.flatMap((application) =>
				application.product.composition.map((c) => c.substanceId),
			),
		),
	];
	const treatmentSubstances = substanceIds.flatMap((id) => {
		const substance = substances.find((s) => s.id === id);
		return substance ? [substance] : [];
	});

	const doseLines = treatment.productApplications.map((application) => {
		const unit = t(`substances.units.${application.product.doseUnit}`);
		const dose = `${numberFormat.format(application.dose)} ${unit}`;
		const line = t(
			isDone ? "treatments.card.applied" : "treatments.card.planned",
		).replace("{dose}", dose);
		return productNames.length > 1
			? `${line} · ${productLabel(application.product)}`
			: line;
	});

	const treatmentName = t("treatments.card.name")
		.replace("{product}", title)
		.replace("{parcel}", parcelName);

	return (
		<Card className="flex flex-col gap-3.5 p-4">
			<div className="flex items-start gap-3">
				<span
					aria-hidden="true"
					className="flex size-10 flex-none items-center justify-center rounded-md bg-primary-50 text-primary-700"
				>
					<Droplet className="size-5" />
				</span>
				<div className="flex min-w-0 flex-1 flex-col gap-0.5">
					<h3 className="m-0 text-base leading-[22px] font-semibold">
						{title}
					</h3>
					{authorLabel && (
						<p className="m-0 text-[13px] leading-[18px] text-neutral-600">
							{authorLabel}
						</p>
					)}
					{diseaseLabels.length > 0 && (
						<p className="m-0 text-[13px] leading-[18px] text-neutral-600">
							{t("treatments.card.for").replace(
								"{diseases}",
								listFormat.format(diseaseLabels),
							)}
						</p>
					)}
				</div>
				<span
					className={
						isDone
							? "inline-flex flex-none items-center rounded-full bg-primary-50 px-2.5 py-0.5 text-xs leading-[18px] font-medium text-primary-700"
							: "inline-flex flex-none items-center rounded-full border border-primary-200 bg-white px-2.5 py-0.5 text-xs leading-[18px] font-medium text-primary-700"
					}
				>
					{isDone
						? t("treatments.status.done")
						: t("treatments.card.scheduled")}
				</span>
			</div>

			<ul className="m-0 flex list-none flex-wrap gap-x-4 gap-y-1.5 p-0 text-[13px] leading-[18px] text-neutral-700">
				<li className="inline-flex items-center gap-1.5">
					<MapPin
						aria-hidden="true"
						className="size-3.5 text-muted-foreground"
					/>
					{parcelName}
				</li>
				{formattedDate && (
					<li className="inline-flex items-center gap-1.5">
						<Calendar
							aria-hidden="true"
							className="size-3.5 text-muted-foreground"
						/>
						{formattedDate}
					</li>
				)}
				{treatment.waterDose ? (
					<li className="inline-flex items-center gap-1.5">
						<Droplets
							aria-hidden="true"
							className="size-3.5 text-muted-foreground"
						/>
						{t("treatments.card.water").replace(
							"{water}",
							numberFormat.format(treatment.waterDose),
						)}
					</li>
				) : null}
			</ul>

			<div className="flex items-center justify-between gap-3 border-t border-border pt-3">
				<div className="flex min-w-0 flex-col gap-1.5">
					{doseLines.map((line, index) => (
						<span
							// Lines follow the product applications, which have no id here.
							key={`${index}-${line}`}
							className="text-sm leading-5 font-medium tabular-nums"
						>
							{line}
						</span>
					))}
					{treatmentSubstances.length > 0 && (
						<span className="flex flex-wrap gap-2.5 text-xs leading-4 text-neutral-600">
							{treatmentSubstances.map((substance) => (
								<span
									key={substance.id}
									className="inline-flex items-center gap-[5px]"
								>
									<SubstanceCircle
										substanceName={substance.name}
										className="size-2"
									/>
									{getSubstanceTranslation(substance.name)}
								</span>
							))}
						</span>
					)}
				</div>
				{isOwn && (
					<DeleteTreatmentButton
						treatmentId={treatment.id}
						treatmentName={treatmentName}
						ariaLabel={t("treatments.card.delete")
							.replace("{product}", title)
							.replace("{parcel}", parcelName)}
					/>
				)}
			</div>
		</Card>
	);
}
