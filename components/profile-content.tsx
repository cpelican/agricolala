"use client";

import {
	Mail,
	User,
	FileText,
	Shield,
	CheckCircle,
	XCircle,
	Globe,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { SignOutButton } from "@/components/signout-button";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ChevronRight } from "lucide-react";
import { LocaleLink } from "./locale-link";
import { useTranslations } from "@/hooks/use-translations";
import { type getTosStatus } from "@/app/actions/get-tos-status";

interface LegalAcceptanceStatusProps {
	tosAcceptedAt?: Date | null;
}

function LegalAcceptanceStatus({ tosAcceptedAt }: LegalAcceptanceStatusProps) {
	const { t } = useTranslations();

	return (
		<div className="flex items-center">
			{tosAcceptedAt ? (
				<>
					<CheckCircle className="h-4 w-4 text-green-600 mr-2" />
					<span className="text-sm text-green-600">
						{t("legal.acceptedOn")} {tosAcceptedAt.toLocaleDateString()}
					</span>
				</>
			) : (
				<>
					<XCircle className="h-4 w-4 text-red-600 mr-2" />
					<span className="text-sm text-red-600">{t("legal.notAccepted")}</span>
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
				<LocaleLink href={href} className="flex-1">
					<div className="flex items-center space-x-3">
						{icon}
						<div>
							<div className="font-medium">{title}</div>
							<div className="text-sm text-muted-foreground">{description}</div>
						</div>
					</div>
				</LocaleLink>
				<ChevronRight className="h-6 w-6 text-gray-400" />
			</CardContent>
		</Card>
	);
}

interface ProfileContentProps {
	user: {
		name: string;
		email: string;
		image: string;
	};
	tosStatus: Awaited<ReturnType<typeof getTosStatus>>;
}

export function ProfileContent({ user, tosStatus }: ProfileContentProps) {
	const { t } = useTranslations();

	return (
		<div className="p-4 space-y-4">
			<Card>
				<CardHeader>
					<CardTitle>{t("profile.accountInformation")}</CardTitle>
					<CardDescription>{t("profile.accountDetails")}</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="flex items-center space-x-4">
						<Avatar className="h-16 w-16">
							<AvatarImage src={user?.image || ""} alt={user?.name || ""} />
							<AvatarFallback>
								<User className="h-8 w-8" />
							</AvatarFallback>
						</Avatar>
						<div>
							<h3 className="text-lg font-medium">{user?.name}</h3>
							<div className="flex items-center text-sm text-gray-600">
								<Mail className="h-4 w-4 mr-1" />
								{user?.email}
							</div>
						</div>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>{t("profile.language")}</CardTitle>
					<CardDescription>{t("profile.languageDescription")}</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="flex items-center space-x-3">
						<Globe className="h-5 w-5 text-muted-foreground" />
						<LanguageSwitcher />
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>{t("profile.actions")}</CardTitle>
					<CardDescription>{t("profile.accountManagement")}</CardDescription>
				</CardHeader>
				<CardContent>
					<SignOutButton />
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>{t("profile.aboutAgricolala")}</CardTitle>
					<CardDescription>Version 1.0.0</CardDescription>
				</CardHeader>
				<CardContent>
					<p className="text-sm text-gray-600">
						{t("profile.aboutDescription")}
					</p>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>{t("legal.title")}</CardTitle>
					<CardDescription>{t("legal.description")}</CardDescription>
					<LegalAcceptanceStatus tosAcceptedAt={tosStatus?.tosAcceptedAt} />
				</CardHeader>
				<CardContent className="space-y-3">
					<LegalDocumentCard
						icon={<FileText className="h-5 w-5 text-muted-foreground" />}
						title={t("legal.termsOfService")}
						description={t("legal.readTerms")}
						href="/legal/terms-of-service"
					/>
					<LegalDocumentCard
						icon={<Shield className="h-5 w-5 text-muted-foreground" />}
						title={t("legal.privacyPolicy")}
						description={t("legal.howWeHandleData")}
						href="/legal/privacy-policy"
					/>
				</CardContent>
			</Card>
		</div>
	);
}
