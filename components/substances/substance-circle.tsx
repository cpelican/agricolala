import { useSubstances } from "@/contexts/cached-data-context";
import { cn } from "@/lib/utils";
import { SUBSTANCE_FALLBACK_COLOR } from "@/lib/substance-colors";

export const SubstanceCircle = ({
	substanceName,
	className,
}: {
	substanceName: string;
	className?: string;
}) => {
	const substances = useSubstances();
	const color =
		substances.find((s) => s.name === substanceName)?.color ??
		SUBSTANCE_FALLBACK_COLOR;

	return (
		<span
			aria-hidden="true"
			className={cn("inline-block size-3 flex-none rounded-full", className)}
			style={{ backgroundColor: color }}
		/>
	);
};
