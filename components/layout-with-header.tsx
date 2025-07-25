import type React from "react";
import { requireAuth } from "@/lib/auth-utils";
import { taintUtils } from "@/lib/taint-utils";
import { BottomNavigation } from "./bottom-navigation";
import { UnauthorizedMessage } from "./unauthorized-message";

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
		<div className="min-h-screen bg-primary-10 pb-20">
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
	);
};
