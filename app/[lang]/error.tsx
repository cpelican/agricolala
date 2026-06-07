"use client";

import { RouteErrorContent } from "@/components/misc/route-error-content";
import { useTranslations } from "@/contexts/translations-context";

interface ErrorPageProps {
	error: Error & { digest?: string };
	reset: () => void;
}

export default function ErrorPage({ reset }: ErrorPageProps) {
	const { t } = useTranslations();

	return (
		<RouteErrorContent
			title={t("errors.page.title")}
			description={t("errors.page.description")}
			tryAgainLabel={t("errors.page.tryAgain")}
			backHomeLabel={t("errors.page.backHome")}
			onRetry={reset}
		/>
	);
}
