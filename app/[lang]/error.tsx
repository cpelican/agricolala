"use client";

import { useEffect } from "react";
import { RouteErrorContent } from "@/components/misc/route-error-content";
import { useTranslations } from "@/contexts/translations-context";

interface ErrorPageProps {
	error: Error & { digest?: string };
	reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
	const { t } = useTranslations();

	useEffect(() => {
		console.error("Route error:", error);
	}, [error]);

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
