"use client";

import { Plus } from "lucide-react";
import { LocaleLink } from "./locale-link";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { type ParcelWithTreatments } from "@/lib/data-fetcher";
import { useTranslations } from "@/hooks/use-translations";

interface HomeContentUIProps {
	parcels: ParcelWithTreatments[];
}

export function HomeContentUI({ parcels }: HomeContentUIProps) {
	const { t } = useTranslations();

	if (parcels.length === 0) {
		return (
			<div className="p-4">
				<Card>
					<CardHeader className="text-center">
						<CardTitle>{t("home.welcome")}</CardTitle>
						<CardDescription>{t("home.description")}</CardDescription>
					</CardHeader>
					<CardContent className="text-center">
						<Button asChild className="bg-primary-600 hover:bg-primary-700">
							<LocaleLink href="/parcels">
								<Plus className="h-4 w-4 mr-2" />
								{t("parcels.addParcel")}
							</LocaleLink>
						</Button>
					</CardContent>
				</Card>
			</div>
		);
	}

	return null;
}
