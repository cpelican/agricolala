import { useSubstances } from "@/contexts/cached-data-context";

export const SubstanceCircle = ({
	substanceName,
}: {
	substanceName: string;
}) => {
	const substances = useSubstances();

	const getSubstanceColor = (substanceName: string) => {
		const substance = substances.find((s) => s.name === substanceName);
		return substance?.color || "rgb(182, 182, 182)";
	};

	return (
		<div
			className="w-3 h-3 rounded-full"
			style={{
				backgroundColor: getSubstanceColor(substanceName),
			}}
		/>
	);
};
