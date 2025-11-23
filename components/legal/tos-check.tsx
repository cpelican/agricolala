"use client";

import { useEffect, useState } from "react";
import { TosAcceptanceDialog } from "./tos-acceptance-dialog";
import { acceptTos } from "@/app/actions/accept-tos";
import { getTosStatus } from "@/app/actions/get-tos-status";
import { useRouter } from "next/navigation";

interface TosCheckProps {
	children: React.ReactNode;
	userEmail?: string | null;
}

export function TosCheck({ children, userEmail }: TosCheckProps) {
	const [showTosDialog, setShowTosDialog] = useState(false);
	const [isChecking, setIsChecking] = useState(true);
	const router = useRouter();

	useEffect(() => {
		const checkTosAcceptance = async () => {
			if (userEmail) {
				try {
					const result = await getTosStatus();

					if (result.success && !result.tosAccepted) {
						setShowTosDialog(true);
					}
				} catch (error) {
					console.error("Error checking ToS status:", error);
				}
			}

			setIsChecking(false);
		};

		checkTosAcceptance();
	}, [userEmail]);

	const handleAcceptTos = async () => {
		try {
			const result = await acceptTos();
			if (result.success) {
				setShowTosDialog(false);
				// Refresh the page to update the session
				router.refresh();
			} else {
				console.error("Failed to accept ToS:", result.error);
			}
		} catch (error) {
			console.error("Error accepting ToS:", error);
		}
	};

	const handleDeclineTos = () => {
		// Sign out the user if they decline ToS
		router.push("/api/auth/signout");
	};

	if (isChecking) {
		return null; // or a loading spinner
	}

	return (
		<>
			{children}
			<TosAcceptanceDialog
				open={showTosDialog}
				onAccept={handleAcceptTos}
				onDecline={handleDeclineTos}
			/>
		</>
	);
}
