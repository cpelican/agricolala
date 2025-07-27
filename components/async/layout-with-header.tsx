import type React from "react";
import { requireAuth } from "@/lib/auth-utils";
import { taintUtils } from "@/lib/taint-utils";
import { BottomNavigation } from "../routing/bottom-navigation";
import { UnauthorizedMessage } from "../misc/unauthorized-message";
import { SidebarNavigation } from "../routing/sidebar-navigation";

interface LayoutWithHeaderProps {
	children: React.ReactNode;
	icon: React.ReactNode;
	title: string;
	subtitle: string;
}

export const LayoutWithHeader: React.FC<LayoutWithHeaderProps> = async ({
	children,
	icon,
	title,
	subtitle,
}) => {
	const session = await requireAuth();

	taintUtils.taintObject(
		"Do not pass user session data to the client. Instead, pick off specific properties you need.",
		session,
	);

	if (!session.user.isAuthorized) {
		return <UnauthorizedMessage />;
	}
	return (
		<>
			<div className="sm:hidden min-h-screen bg-primary-10 pb-20">
				<div className="text-white/90 p-4 flex items-center gap-x-4 bg-main-gradient">
					{icon}
					<div>
						<h1 className="text-2xl font-semibold">{title}</h1>
						<p className="font-light">{subtitle}</p>
					</div>
				</div>

				{children}
				<BottomNavigation />
			</div>
			<div className="hidden sm:grid sm:grid-cols-[20rem_1fr] sm:h-screen">
				<nav className="bg-sidebar  border-r border-sidebar-border">
					<div className="text-white/90 p-4 flex items-center gap-x-4 bg-main-gradient">
						{icon}
						<div>
							<h1 className="text-2xl font-semibold">{title}</h1>
							<p className="font-light truncate max-w-[15rem]">{subtitle}</p>
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
