import { FileText, Shield, ExternalLink } from "lucide-react";
import Link from "next/link";

interface TosContentProps {
	showLinks?: boolean;
}

const tosContent = {
	sections: [
		{
			title: "1. Acceptance of Terms",
			content:
				'By accessing and using Agraria PWA ("the Service"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.',
		},
		{
			title: "2. Description of Service",
			content:
				"Agraria PWA is an agricultural management application that allows users to:",
			listItems: [
				"Track agricultural parcels and their characteristics",
				"Record treatment applications and chemical usage",
				"Monitor substance usage and compliance",
				"Generate reports and analytics for agricultural operations",
			],
		},
		{
			title: "3. User Responsibilities",
			content: "As a user of this Service, you agree to:",
			listItems: [
				"Provide accurate and complete information about your agricultural operations",
				"Comply with all applicable local, state, and federal agricultural regulations",
				"Use the Service only for lawful agricultural purposes",
				"Maintain the security of your account credentials",
				"Not share your account with unauthorized users",
				"Report any suspected security breaches immediately",
			],
		},
		{
			title: "4. Agricultural Data and Compliance",
			content:
				"Important Disclaimer: This application is designed to assist with agricultural record-keeping and is not a substitute for professional agricultural advice or regulatory compliance.",
			listItems: [
				"Users are responsible for ensuring compliance with all applicable agricultural regulations",
				"The Service does not guarantee regulatory compliance or agricultural outcomes",
				"Users must verify all chemical usage data against official product labels and regulations",
				"Agricultural decisions should be made in consultation with qualified professionals",
			],
		},
		{
			title: "5. Data Ownership and Usage",
			content: [
				"Your Data: You retain ownership of all agricultural data you enter into the Service.",
				"Service Usage: We may use aggregated, anonymized data to improve the Service and provide analytics, but we will never sell your individual agricultural data to third parties.",
				"Data Export: You can export your data at any time through the Service's export features.",
			],
		},
		{
			title: "6. Limitation of Liability",
			content:
				'Agricultural Disclaimer: The Service is provided "as is" without warranties of any kind. We are not liable for:',
			listItems: [
				"Crop losses or agricultural outcomes based on data entered in the Service",
				"Regulatory compliance issues or violations",
				"Incorrect chemical application rates or timing",
				"Service interruptions or data loss",
				"Decisions made based on the information provided by the Service",
			],
		},
	],
	links: {
		title: "📄 Read Full Legal Documents",
		description:
			"Important: For complete legal information, please read the full documents:",
		termsOfService: "Full Terms of Service",
		privacyPolicy: "Full Privacy Policy",
		note: "💡 These links will open in a new tab so you can read the full documents while keeping this dialog open.",
	},
};

export function TosContent({ showLinks = false }: TosContentProps) {
	return (
		<div className="space-y-6">
			{tosContent.sections.map((section, index) => (
				<section key={index} className="space-y-3">
					<h4 className="text-lg font-semibold text-gray-900">
						{section.title}
					</h4>
					<div className="space-y-3">
						{typeof section.content === "string" ? (
							<p className="text-gray-700 leading-relaxed">{section.content}</p>
						) : (
							section.content.map((paragraph, pIndex) => (
								<p key={pIndex} className="text-gray-700 leading-relaxed">
									{paragraph}
								</p>
							))
						)}
						{section.listItems && (
							<ul className="list-disc pl-6 space-y-2 text-gray-700">
								{section.listItems.map((item, itemIndex) => (
									<li key={itemIndex} className="leading-relaxed">
										{item}
									</li>
								))}
							</ul>
						)}
					</div>
				</section>
			))}

			{showLinks && (
				<section className="border border-blue-200 bg-blue-50/50 rounded-lg p-6 space-y-4">
					<h4 className="text-lg font-semibold text-blue-900">
						{tosContent.links.title}
					</h4>
					<p className="text-sm text-blue-700">
						<strong>{tosContent.links.description}</strong>
					</p>
					<div className="space-y-3">
						<Link
							href="/legal/terms-of-service"
							target="_blank"
							className="flex items-center justify-between p-4 rounded-lg border-2 border-blue-200 bg-white hover:bg-blue-50 hover:border-blue-300 transition-colors"
						>
							<div className="flex items-center gap-3">
								<FileText className="h-5 w-5 text-blue-600" />
								<span className="font-medium text-blue-900">
									{tosContent.links.termsOfService}
								</span>
							</div>
							<ExternalLink className="h-5 w-5 text-blue-600" />
						</Link>
						<Link
							href="/legal/privacy-policy"
							target="_blank"
							className="flex items-center justify-between p-4 rounded-lg border-2 border-blue-200 bg-white hover:bg-blue-50 hover:border-blue-300 transition-colors"
						>
							<div className="flex items-center gap-3">
								<Shield className="h-5 w-5 text-blue-600" />
								<span className="font-medium text-blue-900">
									{tosContent.links.privacyPolicy}
								</span>
							</div>
							<ExternalLink className="h-5 w-5 text-blue-600" />
						</Link>
					</div>
					<p className="text-xs text-blue-600">{tosContent.links.note}</p>
				</section>
			)}
		</div>
	);
}
