"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslations } from "@/contexts/translations-context";
import {
	canRequestGeolocation,
	geolocationFailureMessage,
	type UserLocationFailureReason,
} from "@/lib/user-location";

export function ParcelMapLocationBanner({
	failure,
	onDismiss,
	onUseMyLocation,
}: {
	failure: UserLocationFailureReason;
	onDismiss: () => void;
	onUseMyLocation: () => void;
}) {
	const { t } = useTranslations();

	return (
		<div className="absolute top-2 left-2 right-2 z-[1000] rounded-lg border bg-background/95 p-3 pr-10 shadow-md">
			<Button
				type="button"
				variant="ghost"
				size="sm"
				className="absolute top-2 right-2 h-6 w-6 p-0"
				onClick={onDismiss}
				aria-label={t("common.close")}
			>
				<X className="h-4 w-4" />
			</Button>
			<p className="text-sm text-muted-foreground">
				{geolocationFailureMessage(failure, t)}
			</p>
			{canRequestGeolocation() && (
				<Button
					type="button"
					variant="outline"
					size="sm"
					className="mt-2"
					onClick={onUseMyLocation}
				>
					{t("parcels.useMyLocation")}
				</Button>
			)}
		</div>
	);
}
