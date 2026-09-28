import { PhenologicalStage } from "@prisma/client";
import type { ReactNode } from "react";

const GREEN = "#1a9e1a";
const YELLOW = "#f2b01e";
const PURPLE = "#4b3aa6";
const GROUND = "#b8b8b0";

// Bunch shape shared by every cluster pictogram: rows of 4, 4, 3, 2, 1 berries.
const BUNCH_ROWS = [4, 4, 3, 2, 1] as const;
// Berries drawn purple at colour change, by position in the bunch.
const VERAISON_PURPLE = new Set([1, 3, 4, 6, 9, 11, 12]);

function Bunch({
	cx,
	top,
	radius,
	dx,
	dy,
	fillAt,
	stroke,
}: {
	cx: number;
	top: number;
	radius: number;
	dx: number;
	dy: number;
	fillAt: (index: number) => string;
	stroke: string;
}) {
	let index = 0;
	return (
		<>
			{BUNCH_ROWS.flatMap((count, row) =>
				Array.from({ length: count }, (_, column) => {
					const berry = index++;
					return (
						<circle
							key={berry}
							cx={cx + (column - (count - 1) / 2) * dx}
							cy={top + row * dy}
							r={radius}
							fill={fillAt(berry)}
							stroke={stroke}
							strokeWidth={1}
						/>
					);
				}),
			)}
		</>
	);
}

function Ground() {
	return (
		<line
			x1={4}
			y1={46}
			x2={40}
			y2={46}
			stroke={GROUND}
			strokeWidth={3}
			strokeLinecap="round"
		/>
	);
}

function Stem({ from, to }: { from: number; to: number }) {
	return (
		<line x1={22} y1={from} x2={22} y2={to} stroke={GREEN} strokeWidth={1.5} />
	);
}

function Leaf({ cx, cy, angle }: { cx: number; cy: number; angle: number }) {
	return (
		<ellipse
			cx={cx}
			cy={cy}
			rx={9}
			ry={5}
			transform={`rotate(${angle} ${cx} ${cy})`}
			fill={GREEN}
		/>
	);
}

function hangingBunch(
	radius: number,
	spacing: number,
	fillAt: (i: number) => string,
	stroke = GREEN,
) {
	return (
		<>
			<Stem from={2} to={12} />
			<Bunch
				cx={22}
				top={12}
				radius={radius}
				dx={spacing}
				dy={spacing * 0.85}
				fillAt={fillAt}
				stroke={stroke}
			/>
		</>
	);
}

const PICTOGRAMS = {
	[PhenologicalStage.BUD_BREAK]: (
		<>
			<Ground />
			<ellipse cx={22} cy={34} rx={6} ry={10} fill={GREEN} />
		</>
	),
	[PhenologicalStage.LEAVES_UNFOLDING]: (
		<>
			<Ground />
			<Stem from={46} to={12} />
			<Leaf cx={13} cy={30} angle={-30} />
			<Leaf cx={31} cy={19} angle={30} />
		</>
	),
	[PhenologicalStage.FLOWER_CLUSTERS]: (
		<>
			<Ground />
			<Stem from={46} to={8} />
			<Leaf cx={32} cy={16} angle={30} />
			<Bunch
				cx={14}
				top={22}
				radius={2}
				dx={5}
				dy={4.25}
				fillAt={() => GREEN}
				stroke={GREEN}
			/>
		</>
	),
	[PhenologicalStage.FLOWERING]: hangingBunch(3, 7, () => YELLOW),
	[PhenologicalStage.FRUIT_SET]: hangingBunch(3, 9, () => GREEN),
	[PhenologicalStage.BUNCH_CLOSURE]: hangingBunch(4.8, 9, () => GREEN),
	[PhenologicalStage.VERAISON]: hangingBunch(4.8, 9, (i) =>
		VERAISON_PURPLE.has(i) ? PURPLE : GREEN,
	),
	[PhenologicalStage.RIPE]: hangingBunch(4.8, 9, () => PURPLE, PURPLE),
} satisfies Record<PhenologicalStage, ReactNode>;

// Small coloured pictogram of a vine stage (option B of the design doc).
export function StageIcon({
	stage,
	className,
}: {
	stage: PhenologicalStage;
	className?: string;
}) {
	return (
		<svg
			viewBox="0 0 44 50"
			className={className}
			aria-hidden="true"
			focusable="false"
		>
			{PICTOGRAMS[stage]}
		</svg>
	);
}
