"use client";

import type { PhenologicalStage } from "@prisma/client";

import { PHENOLOGICAL_STAGES } from "@/lib/phenology";
import { cn } from "@/lib/utils";
import { StageIcon } from "./stage-icon";

interface StagePickerProps {
	t: (key: string) => string;
	value: PhenologicalStage | null;
	onChange: (stage: PhenologicalStage | null) => void;
}

// Two rows of 4 small pictograms; tapping the selected stage again clears it.
export function StagePicker({ t, value, onChange }: StagePickerProps) {
	return (
		<div className="space-y-1">
			<div
				role="radiogroup"
				aria-label={t("phenology.title")}
				className="grid grid-cols-4 gap-1"
			>
				{PHENOLOGICAL_STAGES.map((stage) => {
					const isSelected = stage === value;
					return (
						<button
							key={stage}
							type="button"
							role="radio"
							aria-checked={isSelected}
							title={t(`phenology.stages.${stage}.description`)}
							onClick={() => onChange(isSelected ? null : stage)}
							className={cn(
								"flex flex-col items-center gap-0.5 rounded-md border p-1 text-[11px] leading-tight transition-colors",
								isSelected
									? "border-primary bg-primary/10 font-medium"
									: "border-transparent hover:bg-muted",
							)}
						>
							<StageIcon stage={stage} className="h-9 w-9" />
							<span className="text-center">
								{t(`phenology.stages.${stage}.label`)}
							</span>
						</button>
					);
				})}
			</div>
			{value ? (
				<p className="text-xs text-muted-foreground">
					{t(`phenology.stages.${value}.description`)}
				</p>
			) : null}
		</div>
	);
}
