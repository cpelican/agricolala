"use client";

import type { PhenologicalStage } from "@prisma/client";
import { Thermometer } from "lucide-react";
import { useSyncExternalStore } from "react";

import { ExperimentalLabel } from "@/components/substances/disease-badges";
import { Button } from "@/components/ui/button";
import { useTranslations } from "@/contexts/translations-context";
import { useRecordStage } from "./use-record-stage";

// "Not yet" hides the prompt this long on this device; it comes back while the
// temperature sum keeps rising.
const NOT_YET_DAYS = 3;
const MS_PER_DAY = 1000 * 60 * 60 * 24;
const NOT_YET_EVENT = "stage-estimate-not-yet";

// Browser storage can be missing or blocked (private window, previews): the prompt
// then simply shows again.
function readNotYetUntil(key: string): number {
	try {
		return Number(window.localStorage.getItem(key)) || 0;
	} catch {
		return 0;
	}
}

function writeNotYetUntil(key: string, until: number) {
	try {
		window.localStorage.setItem(key, String(until));
	} catch {
		// Not saved: the prompt is hidden until the page reloads.
	}
	window.dispatchEvent(new Event(NOT_YET_EVENT));
}

function subscribe(onChange: () => void) {
	window.addEventListener("storage", onChange);
	window.addEventListener(NOT_YET_EVENT, onChange);
	return () => {
		window.removeEventListener("storage", onChange);
		window.removeEventListener(NOT_YET_EVENT, onChange);
	};
}

// P5: the temperatures since 1 March say the parcel has probably reached `stage`;
// nothing is recorded until the grower confirms.
export function StageEstimatePrompt({
	parcelId,
	stage,
}: {
	parcelId: string;
	stage: PhenologicalStage;
}) {
	const { t, locale } = useTranslations();
	const { recordStage, isSubmitting } = useRecordStage(parcelId);
	const storageKey = `${NOT_YET_EVENT}:${parcelId}:${stage}`;
	const isSnoozed = useSyncExternalStore(
		subscribe,
		() => readNotYetUntil(storageKey) > Date.now(),
		// Hidden on the server; the client shows it unless "Not yet" is still on.
		() => true,
	);
	if (isSnoozed) return null;

	const label = t(`phenology.stages.${stage}.label`).toLocaleLowerCase(locale);

	return (
		<div
			role="note"
			data-testid="stage-estimate-prompt"
			className="space-y-2 rounded-md border border-primary/30 bg-primary/5 px-3 py-2.5 text-sm"
		>
			<div className="flex flex-wrap items-center gap-x-2 gap-y-1">
				<p className="m-0 flex items-center gap-1.5 font-medium">
					<Thermometer className="h-4 w-4 shrink-0" aria-hidden />
					{t("phenology.estimateTitle").replace("{stage}", label)}
				</p>
				<ExperimentalLabel />
			</div>
			<p className="m-0 text-muted-foreground">{t("phenology.estimateBody")}</p>
			<div className="flex flex-wrap gap-2">
				<Button
					type="button"
					size="sm"
					onClick={() => void recordStage(stage)}
					disabled={isSubmitting}
				>
					{t("phenology.estimateConfirm")}
				</Button>
				<Button
					type="button"
					size="sm"
					variant="outline"
					onClick={() =>
						writeNotYetUntil(storageKey, Date.now() + NOT_YET_DAYS * MS_PER_DAY)
					}
					disabled={isSubmitting}
				>
					{t("phenology.estimateNotYet")}
				</Button>
			</div>
		</div>
	);
}
