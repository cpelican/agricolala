"use client";

import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface BackButtonProps {
	fallbackPath?: string;
	className?: string;
}

export function BackButton({ fallbackPath = "/", className }: BackButtonProps) {
	const router = useRouter();

	const handleGoBack = () => {
		if (window.history.length > 1) {
			router.back();
		} else {
			router.push(fallbackPath);
		}
	};

	return (
		<Button
			variant="ghost"
			size="sm"
			className={`gap-2 bg-primary-50 hover:bg-primary-100 focus:bg-primary-100 max-w-fit ${className || ""}`}
			onClick={handleGoBack}
		>
			<ChevronLeft className="h-4 w-4" />
			Back
		</Button>
	);
}
