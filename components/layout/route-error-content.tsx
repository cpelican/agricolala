"use client";

import { LocaleLink } from "@/components/locale/locale-link";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

interface RouteErrorContentProps {
	title: string;
	description: string;
	backHomeLabel: string;
	tryAgainLabel?: string;
	onRetry?: () => void;
}

export function RouteErrorContent({
	title,
	description,
	tryAgainLabel,
	backHomeLabel,
	onRetry,
}: RouteErrorContentProps) {
	return (
		<Card className="m-4">
			<CardHeader className="text-center">
				<CardTitle>{title}</CardTitle>
				<CardDescription>{description}</CardDescription>
			</CardHeader>
			<CardFooter className="flex flex-col gap-2 sm:flex-row sm:justify-center">
				{onRetry && tryAgainLabel ? (
					<Button type="button" onClick={onRetry}>
						{tryAgainLabel}
					</Button>
				) : null}
				<Button type="button" variant="outline" asChild>
					<LocaleLink href="/">{backHomeLabel}</LocaleLink>
				</Button>
			</CardFooter>
		</Card>
	);
}
