import { FileText } from "lucide-react";
import { AuthGuard } from "@/components/auth-guard";
import { LayoutWithHeader } from "@/components/layout-with-header";
import { TosContent } from "@/components/tos-content";
import { BackButton } from "@/components/back-button";

export default function TermsOfServicePage() {
	return (
		<AuthGuard>
			<LayoutWithHeader
				title="Terms of Service"
				subtitle="Usage terms and conditions"
				icon={<FileText />}
			>
				<div className="p-4 flex flex-col gap-2">
					<BackButton />
					<TosContent showLinks={false} />
				</div>
			</LayoutWithHeader>
		</AuthGuard>
	);
}
