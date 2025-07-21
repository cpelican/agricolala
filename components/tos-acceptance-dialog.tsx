"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { FileText } from "lucide-react";
import { TosContent } from "./tos-content";
import { PrivacyContent } from "./privacy-content";

interface TosAcceptanceDialogProps {
	open: boolean;
	onAccept: () => void;
	onDecline: () => void;
}

export function TosAcceptanceDialog({
	open,
	onAccept,
	onDecline,
}: TosAcceptanceDialogProps) {
	const [accepted, setAccepted] = useState(false);

	const handleAccept = () => {
		if (accepted) {
			onAccept();
		}
	};

	return (
		<Dialog open={open} onOpenChange={() => {}}>
			<DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<FileText className="h-5 w-5" />
						Welcome to Agraria PWA
					</DialogTitle>
					<DialogDescription>
						Please read and accept our Terms of Service and Privacy Policy to
						continue using the application.
					</DialogDescription>
				</DialogHeader>

				<div className="flex-1 overflow-y-auto max-h-[60vh]">
					<div className="pr-4 space-y-6">
						<div>
							<h3 className="text-lg font-semibold mb-4">Terms of Service</h3>
							<TosContent showLinks={false} />
						</div>

						<div className="border-t pt-6">
							<h3 className="text-lg font-semibold mb-4">Privacy Policy</h3>
							<PrivacyContent showLinks={false} />
						</div>
					</div>
				</div>

				<div className="flex items-center space-x-2 mb-4">
					<Checkbox
						id="tos-accept"
						checked={accepted}
						onCheckedChange={(checked) => setAccepted(checked as boolean)}
					/>
					<Label htmlFor="tos-accept" className="text-sm">
						I have read and agree to the Terms of Service and Privacy Policy
					</Label>
				</div>

				<DialogFooter className="gap-2">
					<Button variant="outline" onClick={onDecline}>
						Decline
					</Button>
					<Button onClick={handleAccept} disabled={!accepted}>
						Accept Terms
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
