import type { ReactNode } from "react";
import { LocaleLink } from "@/components/locale/locale-link";
import { BottomNavigation } from "./bottom-navigation";
import { SidebarNavigation } from "./sidebar-navigation";

// Same as the welcome header: 20px bold, dark green held to 30% then lime.
const WORDMARK =
	"wordmark-gradient text-xl leading-6 font-bold tracking-[-0.01em]";
const HOME_LINK = "flex items-center gap-2 rounded-md no-underline";

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
				<header className="flex h-16 items-center border-b border-border px-4">
					<LocaleLink href="/" className={HOME_LINK}>
						{icon}
						<span className={WORDMARK}>{title}</span>
					</LocaleLink>
				</header>

				<main>{children}</main>
				<BottomNavigation />
			</div>
			<div className="hidden sm:grid sm:grid-cols-[20rem_1fr] sm:h-screen">
				<nav className="bg-sidebar  border-r border-sidebar-border">
					<div className="flex h-16 items-center px-4">
						<LocaleLink href="/" className={HOME_LINK}>
							{icon}
							<span className={WORDMARK}>{title}</span>
						</LocaleLink>
					</div>
					<div className="p-4">
						<SidebarNavigation />
					</div>
				</nav>
				<main className="overflow-auto bg-primary-10">
					<div className="p-6">
						<div className="max-w-3xl mx-auto">{children}</div>
					</div>
				</main>
			</div>
		</>
	);
};
