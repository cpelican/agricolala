import { LogOut, Mail, User } from "lucide-react";
import { signOut } from "next-auth/react";
import { AuthGuard } from "@/components/auth-guard";
import { BottomNavigation } from "@/components/bottom-navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { LayoutWithHeader } from "@/components/layout-with-header";
import { requireAuth } from "@/lib/auth-utils";

export default async function ProfilePage() {
	const session = await requireAuth();

	return (
		<AuthGuard>
			<LayoutWithHeader
				title="Profile"
				subtitle="Manage your account settings"
				icon={<User />}
			>
				<div className="p-4 space-y-4">
					<Card>
						<CardHeader>
							<CardTitle>Account Information</CardTitle>
							<CardDescription>Your profile details</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="flex items-center space-x-4">
								<Avatar className="h-16 w-16">
									<AvatarImage
										src={session?.user?.image || ""}
										alt={session?.user?.name || ""}
									/>
									<AvatarFallback>
										<User className="h-8 w-8" />
									</AvatarFallback>
								</Avatar>
								<div>
									<h3 className="text-lg font-medium">{session?.user?.name}</h3>
									<div className="flex items-center text-sm text-gray-600">
										<Mail className="h-4 w-4 mr-1" />
										{session?.user?.email}
									</div>
								</div>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>Actions</CardTitle>
							<CardDescription>Account management options</CardDescription>
						</CardHeader>
						<CardContent>
							<Button
								onClick={() => signOut({ callbackUrl: "/auth/signin" })}
								variant="destructive"
								className="w-full"
							>
								<LogOut className="h-4 w-4 mr-2" />
								Sign Out
							</Button>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>About Agricolala</CardTitle>
							<CardDescription>Version 1.0.0</CardDescription>
						</CardHeader>
						<CardContent>
							<p className="text-sm text-gray-600">
								Agricolala helps you manage your vineyard treatments and track
								substance usage to ensure compliance with agricultural
								regulations.
							</p>
						</CardContent>
					</Card>
				</div>

				<BottomNavigation />
			</LayoutWithHeader>
		</AuthGuard>
	);
}
