import { Shield } from "lucide-react";
import { AuthGuard } from "@/components/auth-guard";
import { LayoutWithHeader } from "@/components/layout-with-header";
import { PrivacyContent } from "@/components/privacy-content";
import { BackButton } from "@/components/back-button";

export default function PrivacyPolicyPage() {
	return (
		<AuthGuard>
			<LayoutWithHeader
				title="Privacy Policy"
				subtitle="How we handle your data"
				icon={<Shield />}
			>
				<div className="p-4 flex flex-col gap-2">
					<BackButton />
					<PrivacyContent showLinks={false} />
				</div>
			</LayoutWithHeader>
		</AuthGuard>
	);
}
