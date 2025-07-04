import { requireAuth } from "@/lib/auth-utils";
import {
	Card,
	CardHeader,
	CardTitle,
	CardDescription,
	CardFooter,
} from "./ui/card";
import { SignOutButton } from "./signoutButton";

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
	if (!session.user.isAuthorized) {
		return (
			<Card className="p-4 m-4">
				<CardHeader className="text-center">
					<CardTitle>Welcome to Agricolala</CardTitle>
					<CardDescription>
						This app is still a work in progress, so we prefer to know a bit who
						will use it. Please contact the admin to unlock your account.
					</CardDescription>
				</CardHeader>
				<CardFooter>
					<SignOutButton />
				</CardFooter>
			</Card>
		);
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
		</div>
	);
};
