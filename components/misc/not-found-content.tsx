"use client";

import { RouteErrorContent } from "@/components/misc/route-error-content";
import { useTranslations } from "@/contexts/translations-context";

export function NotFoundContent() {
	const { t } = useTranslations();

	return (
		<RouteErrorContent
			title={t("errors.notFound.title")}
			description={t("errors.notFound.description")}
			backHomeLabel={t("errors.notFound.backHome")}
		/>
	);
}
