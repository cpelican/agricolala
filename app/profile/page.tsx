"use client";

import { signOut, useSession } from "next-auth/react";
import { AuthGuard } from "@/components/auth-guard";
import { BottomNavigation } from "@/components/bottom-navigation";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogOut, User, Mail } from "lucide-react";

export default function ProfilePage() {
	const { data: session } = useSession();

	return (
		<AuthGuard>
			<div className="min-h-screen bg-gray-50 pb-20">
				<div className="bg-green-600 text-white p-4">
					<h1 className="text-2xl font-bold">Profile</h1>
					<p className="text-green-100">Manage your account settings</p>
				</div>

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
							<CardTitle>About Agraria</CardTitle>
							<CardDescription>Version 1.0.0</CardDescription>
						</CardHeader>
						<CardContent>
							<p className="text-sm text-gray-600">
								Agraria helps you manage your vineyard treatments and track
								substance usage to ensure compliance with agricultural
								regulations.
							</p>
						</CardContent>
					</Card>
				</div>

				<BottomNavigation />
			</div>
		</AuthGuard>
	);
}
