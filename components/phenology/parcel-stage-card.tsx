"use client";

import type { PhenologicalStage } from "@prisma/client";
import { useState } from "react";

import { Card, CardContent } from "@/components/ui/card";
import { useTranslations } from "@/contexts/translations-context";
import { PHENOLOGICAL_STAGES } from "@/lib/phenology";
import type { CurrentParcelStage } from "@/lib/phenology-observations";
import { cn } from "@/lib/utils";
import { ConfirmStageDialog } from "./confirm-stage-dialog";
import { StageIcon } from "./stage-icon";
import { formatStageSetAgo } from "./stage-set-ago";

interface ParcelStageCardProps {
	parcelId: string;
	// Current (non-expired) observation, or null when the stage is unknown.
	observation: CurrentParcelStage | null;
}

// Parcel detail: the season as 8 tiles, the current stage highlighted. Tapping
// another tile asks for confirmation, then records it as today's stage.
export function ParcelStageCard({
	parcelId,
	observation,
}: ParcelStageCardProps) {
	const { t } = useTranslations();
	const [pendingStage, setPendingStage] = useState<PhenologicalStage | null>(
		null,
	);
	const current = observation?.stage ?? null;

	return (
		<Card>
			<CardContent className="p-4 space-y-3">
				<div className="flex items-baseline justify-between gap-2">
					<p>
						<span className="text-muted-foreground">
							{t("phenology.growthStage")}
						</span>{" "}
						<span className="font-semibold">
							{current
								? t(`phenology.stages.${current}.label`)
								: t("phenology.unknown")}
						</span>
					</p>
					{observation ? (
						<span className="text-xs text-muted-foreground whitespace-nowrap">
							{formatStageSetAgo(t, observation.observedAt, new Date())}
						</span>
					) : null}
				</div>
				<div className="grid grid-cols-8 gap-1.5">
					{PHENOLOGICAL_STAGES.map((stage) => {
						const isCurrent = stage === current;
						const label = t(`phenology.stages.${stage}.label`);
						return (
							<button
								key={stage}
								type="button"
								title={label}
								aria-label={t("phenology.markStage").replace("{stage}", label)}
								aria-pressed={isCurrent}
								onClick={() => {
									if (!isCurrent) {
										setPendingStage(stage);
									}
								}}
								className={cn(
									"flex aspect-square items-center justify-center rounded-lg border transition-colors",
									isCurrent
										? "border-primary bg-primary/10"
										: "border-border/60 hover:bg-muted [&_svg]:opacity-40 hover:[&_svg]:opacity-100",
								)}
							>
								<StageIcon stage={stage} className="h-3/5 w-3/5" />
							</button>
						);
					})}
				</div>
				<ConfirmStageDialog
					parcelId={parcelId}
					stage={pendingStage}
					currentStage={current}
					onClose={() => setPendingStage(null)}
				/>
			</CardContent>
		</Card>
	);
}
