import { useTranslations } from "@/contexts/translations-context";
import { cn } from "@/lib/utils";
import { type UserSubstanceAggregation } from "@prisma/client";
import {
	TooltipTrigger,
	TooltipContent,
	Tooltip,
} from "@radix-ui/react-tooltip";

const getPercentageChange = (
	currentYearData: Pick<
		UserSubstanceAggregation,
		"totalUsedOfPureActiveSubstancePerHa"
	>,
	lastYearData?: Pick<
		UserSubstanceAggregation,
		"totalUsedOfPureActiveSubstancePerHa"
	>,
) => {
	const percentageChange =
		lastYearData &&
		currentYearData &&
		lastYearData.totalUsedOfPureActiveSubstancePerHa > 0
			? ((currentYearData.totalUsedOfPureActiveSubstancePerHa -
					lastYearData.totalUsedOfPureActiveSubstancePerHa) /
					lastYearData.totalUsedOfPureActiveSubstancePerHa) *
				100
			: null;

	const hasIncreased = percentageChange !== null && percentageChange > 0;
	const hasDecreased = percentageChange !== null && percentageChange < 0;
	return {
		percentageChange,
		hasIncreased,
		hasDecreased,
	};
};

export const PercentageInfo = ({
	currentYearData,
	lastYearData,
}: {
	currentYearData: Pick<
		UserSubstanceAggregation,
		"totalUsedOfPureActiveSubstancePerHa"
	>;
	lastYearData?: Pick<
		UserSubstanceAggregation,
		"totalUsedOfPureActiveSubstancePerHa"
	>;
}) => {
	const { percentageChange, hasIncreased, hasDecreased } = getPercentageChange(
		currentYearData,
		lastYearData,
	);
	const { t } = useTranslations();

	if (percentageChange === null) {
		return null;
	}

	if (percentageChange === 0) {
		return null;
	}

	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<span
					className={cn("text-sm font-medium cursor-help", {
						"text-green-700 dark:text-green-600": hasDecreased,
						"text-orange-600 dark:text-orange-600": hasIncreased,
					})}
				>
					{hasDecreased ? "↓" : hasIncreased ? "↑" : ""}
					{percentageChange !== null
						? Math.abs(percentageChange).toFixed(1)
						: "N/A"}
					%
				</span>
			</TooltipTrigger>
			<TooltipContent>
				<p>{t("substances.comparedToLastYear")}</p>
			</TooltipContent>
		</Tooltip>
	);
};
