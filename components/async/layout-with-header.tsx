import type { ReactNode } from "react";
import { BottomNavigation } from "../routing/bottom-navigation";
import { SidebarNavigation } from "../routing/sidebar-navigation";

// Same as the welcome header: 20px bold, dark green held to 30% then lime.
const WORDMARK =
	"wordmark-gradient text-xl leading-6 font-bold tracking-[-0.01em]";

interface LayoutWithHeaderProps {
	children: ReactNode;
	icon: ReactNode;
	title: string;
}

export const LayoutWithHeader = async ({
	children,
	icon,
	title,
}: LayoutWithHeaderProps) => {
	return (
		<>
			<div className="sm:hidden min-h-screen bg-primary-10 pb-20">
				<header className="flex h-16 items-center gap-2 border-b border-border px-4">
					{icon}
					<span className={WORDMARK}>{title}</span>
				</header>

				<main>{children}</main>
				<BottomNavigation />
			</div>
			<div className="hidden sm:grid sm:grid-cols-[20rem_1fr] sm:h-screen">
				<nav className="bg-sidebar  border-r border-sidebar-border">
					<div className="flex h-16 items-center gap-2 px-4">
						{icon}
						<span className={WORDMARK}>{title}</span>
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
