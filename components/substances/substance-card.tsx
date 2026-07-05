"use client";

import { Card, CardContent } from "@/components/ui/card";
import { type SubstanceData, type SubstanceCoverage } from "../types";
import { SubstanceCircle } from "./substance-circle";
import { CumulatedDoseSection } from "./cumulated-dose-section";
import {
	ResidualPanel,
	getResidualPanelProps,
} from "./coverage-residual-panel";
import { useTranslations } from "@/contexts/translations-context";
import { useSubstances } from "@/contexts/cached-data-context";

function CoverageSection({
	coverage,
	hasWeatherData,
}: {
	coverage: SubstanceCoverage;
	hasWeatherData: boolean;
}) {
	const { t } = useTranslations();
	const panelProps = getResidualPanelProps(coverage, hasWeatherData, t);

	if (!panelProps) return null;

	return <ResidualPanel {...panelProps} />;
}

interface SubstanceCardProps {
	substance: SubstanceData;
	coverage?: SubstanceCoverage;
	hasWeatherData: boolean;
}

export function SubstanceCard({
	substance,
	coverage,
	hasWeatherData,
}: SubstanceCardProps) {
	const { getSubstanceTranslation } = useTranslations();
	const substances = useSubstances();
	const translatedName = getSubstanceTranslation(substance.name);
	const substanceColor =
		substances.find((s) => s.name === substance.name)?.color ||
		"rgb(182, 182, 182)";

	return (
		<Card>
			<CardContent className="p-4 space-y-4">
				<div className="flex items-center justify-between gap-2">
					<div className="flex items-center gap-2">
						<SubstanceCircle substanceName={substance.name} />
						<h3 className="text-lg font-semibold">{translatedName}</h3>
					</div>
				</div>

				<CumulatedDoseSection
					substance={substance}
					substanceColor={substanceColor}
				/>

				{coverage && (
					<CoverageSection
						coverage={coverage}
						hasWeatherData={hasWeatherData}
					/>
				)}
			</CardContent>
		</Card>
	);
}
