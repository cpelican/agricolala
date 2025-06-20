"use client";

import { MAIN_COLOR } from "@/app/const";

interface LayoutWithHeaderProps {
	children: React.ReactNode;
	icon: React.ReactNode;
	title: string;
	subtitle: string;
}

export const LayoutWithHeader: React.FC<LayoutWithHeaderProps> = ({
	children,
	icon,
	title,
	subtitle,
}) => {
	return (
		<div className="min-h-screen bg-gray-50 pb-20">
			<div
				style={{ background: MAIN_COLOR }}
				className="text-white p-4 flex items-center gap-x-4"
			>
				{icon}
				<div>
					<h1 className="text-2xl font-bold">{title}</h1>
					<p className="text-white-100">{subtitle}</p>
				</div>
			</div>

			{children}
		</div>
	);
};
