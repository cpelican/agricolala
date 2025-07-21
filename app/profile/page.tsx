import {
	Mail,
	User,
	FileText,
	Shield,
	CheckCircle,
	XCircle,
} from "lucide-react";
import { AuthGuard } from "@/components/auth-guard";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { LayoutWithHeader } from "@/components/layout-with-header";
import { requireAuth } from "@/lib/auth-utils";
import { SignOutButton } from "@/components/signoutButton";
import { BottomNavigation } from "@/components/bottom-navigation";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { getTosStatus } from "../actions/get-tos-status";

interface LegalAcceptanceStatusProps {
	tosAcceptedAt?: Date | null;
}

function LegalAcceptanceStatus({ tosAcceptedAt }: LegalAcceptanceStatusProps) {
	return (
		<div className="flex items-center">
			{tosAcceptedAt ? (
				<>
					<CheckCircle className="h-4 w-4 text-green-600 mr-2" />
					<span className="text-sm text-green-600">
						Terms of Service and Privacy Policy accepted on{" "}
						{tosAcceptedAt.toLocaleDateString()}
					</span>
				</>
			) : (
				<>
					<XCircle className="h-4 w-4 text-red-600 mr-2" />
					<span className="text-sm text-red-600">
						Terms of Service and Privacy Policy not accepted
					</span>
				</>
			)}
		</div>
	);
}

interface LegalDocumentCardProps {
	icon: React.ReactNode;
	title: string;
	description: string;
	href: string;
}

function LegalDocumentCard({
	icon,
	title,
	description,
	href,
}: LegalDocumentCardProps) {
	return (
		<Card>
			<CardContent className="p-4 flex justify-between items-center">
				<Link href={href} className="flex-1">
					<div className="flex items-center space-x-3">
						{icon}
						<div>
							<div className="font-medium">{title}</div>
							<div className="text-sm text-muted-foreground">{description}</div>
						</div>
					</div>
				</Link>
				<ChevronRight className="h-6 w-6 text-gray-400" />
			</CardContent>
		</Card>
	);
}

export default async function ProfilePage() {
	const session = await requireAuth();
	const tosStatus = await getTosStatus();

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
							<SignOutButton />
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>About Agricolala</CardTitle>
							<CardDescription>Version 1.0.0</CardDescription>
						</CardHeader>
						<CardContent>
							<p className="text-sm text-gray-600">
								Agricolala helps you manage your wineyard treatments and track
								substance usage to ensure compliance with agricultural
								regulations.
							</p>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>Legal</CardTitle>
							<CardDescription>Terms and privacy information</CardDescription>
							<LegalAcceptanceStatus tosAcceptedAt={tosStatus?.tosAcceptedAt} />
						</CardHeader>
						<CardContent className="space-y-3">
							<LegalDocumentCard
								icon={<FileText className="h-5 w-5 text-muted-foreground" />}
								title="Terms of Service"
								description="Read the full terms"
								href="/legal/terms-of-service"
							/>
							<LegalDocumentCard
								icon={<Shield className="h-5 w-5 text-muted-foreground" />}
								title="Privacy Policy"
								description="How we handle your data"
								href="/legal/privacy-policy"
							/>
						</CardContent>
					</Card>
				</div>

				<BottomNavigation />
			</LayoutWithHeader>
		</AuthGuard>
	);
}
