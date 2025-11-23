import type React from "react";
import { BottomNavigation } from "../routing/bottom-navigation";
import { UnauthorizedMessage } from "../misc/unauthorized-message";
import { SidebarNavigation } from "../routing/sidebar-navigation";

interface LayoutWithHeaderProps {
	children: React.ReactNode;
	icon: React.ReactNode;
	title: string;
	isAuthorized: boolean;
}

export const LayoutWithHeader: React.FC<LayoutWithHeaderProps> = async ({
	children,
	icon,
	title,
	isAuthorized,
}) => {
	if (!isAuthorized) {
		return <UnauthorizedMessage />;
	}
	return (
		<>
			<div className="sm:hidden min-h-screen bg-primary-10 pb-20">
				<div className="p-4 flex items-center gap-x-4 bg-main border-solid border-b-1 border-gray-200">
					{icon}
					<div>
						<h1 className="text-2xl font-semibold gradient-main-title">
							{title}
						</h1>
					</div>
				</div>

				{children}
				<BottomNavigation />
			</div>
			<div className="hidden sm:grid sm:grid-cols-[20rem_1fr] sm:h-screen">
				<nav className="bg-sidebar  border-r border-sidebar-border">
					<div className="p-4 flex items-center gap-x-4">
						{icon}
						<div>
							<h1 className="text-2xl font-semibold gradient-main-title">
								{title}
							</h1>
						</div>
					</div>
					<div className="p-4">
						<SidebarNavigation />
					</div>
				</nav>
				<main className="overflow-auto">
					<div className="p-6">
						<div className="max-w-3xl mx-auto">{children}</div>
					</div>
				</main>
			</div>
		</>
	);
};
