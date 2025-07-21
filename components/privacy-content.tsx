import { Shield, ExternalLink } from "lucide-react";
import Link from "next/link";

interface PrivacyContentProps {
	showLinks?: boolean;
}

const privacyContent = {
	sections: [
		{
			title: "1. Information We Collect",
			content: [
				"Account Information: When you create an account, we collect your name, email address, and authentication information.",
				"Agricultural Data: We collect data you enter about your agricultural operations, including:",
			],
			listItems: [
				"Parcel information (location, size, crop type)",
				"Treatment applications and timing",
				"Chemical usage and substance tracking",
				"Product applications and dosages",
				"Disease and pest management records",
			],
			additionalContent:
				"Usage Data: We collect information about how you use the Service, including access times, features used, and performance data.",
		},
		{
			title: "2. How We Use Your Information",
			content: "We use your information to:",
			listItems: [
				"Provide and maintain the Service",
				"Generate agricultural reports and analytics",
				"Calculate substance usage aggregations",
				"Send you important updates about the Service",
				"Improve and develop new features",
				"Ensure compliance with agricultural regulations",
				"Provide customer support",
			],
		},
		{
			title: "3. Data Sharing and Disclosure",
			content: [
				"We do not sell your agricultural data to third parties.",
				"We may share your information in the following limited circumstances:",
			],
			listItems: [
				"Service Providers: With trusted third-party services that help us operate the Service (hosting, analytics, etc.)",
				"Legal Requirements: When required by law or to protect our rights and safety",
				"Regulatory Compliance: When necessary to comply with agricultural regulations",
				"Aggregated Data: We may share anonymized, aggregated data for research or analytics purposes",
			],
		},
		{
			title: "4. Data Security",
			content:
				"We implement appropriate security measures to protect your agricultural data:",
			listItems: [
				"Encryption of data in transit and at rest",
				"Secure authentication and access controls",
				"Regular security audits and updates",
				"Limited access to your data by authorized personnel only",
				"Backup and disaster recovery procedures",
			],
		},
		{
			title: "5. Data Retention",
			content: [
				"Agricultural Records: We retain your agricultural data for as long as your account is active, as these records are often required for regulatory compliance and may need to be maintained for several years.",
				"Account Data: We retain your account information for as long as your account is active, plus a reasonable period for backup and recovery purposes.",
				"Deletion: You may request deletion of your data, but please note that agricultural records may need to be maintained for regulatory compliance purposes.",
			],
		},
		{
			title: "6. Your Rights",
			content: "You have the following rights regarding your data:",
			listItems: [
				"Access: View and download your agricultural data",
				"Correction: Update or correct inaccurate information",
				"Export: Export your data in a portable format",
				"Deletion: Request deletion of your data (subject to regulatory requirements)",
				"Restriction: Limit how we process your data",
				"Portability: Transfer your data to another service",
			],
		},
		{
			title: "7. Cookies and Tracking",
			content:
				"We use essential cookies to provide the Service functionality. We do not use tracking cookies or third-party analytics that could compromise your privacy.",
		},
		{
			title: "8. Children's Privacy",
			content:
				"Our Service is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If you are a parent or guardian and believe your child has provided us with personal information, please contact us.",
		},
		{
			title: "9. International Data Transfers",
			content:
				"Your data may be processed in countries other than your own. We ensure appropriate safeguards are in place to protect your data in accordance with applicable data protection laws.",
		},
		{
			title: "10. Changes to This Policy",
			content:
				"We may update this Privacy Policy from time to time. We will notify you of significant changes via email or through the Service. Your continued use of the Service after changes constitutes acceptance of the updated policy.",
		},
		{
			title: "11. Contact Us",
			content:
				"If you have questions about this Privacy Policy or want to exercise your data rights, please contact us through the application or at the email address provided in your account settings.",
		},
	],
	links: {
		title: "📄 Read Full Legal Documents",
		description:
			"Important: For complete legal information, please read the full documents:",
		privacyPolicy: "Full Privacy Policy",
		note: "💡 This link will open in a new tab so you can read the full document while keeping this dialog open.",
	},
};

export function PrivacyContent({ showLinks = false }: PrivacyContentProps) {
	return (
		<div className="space-y-6">
			{privacyContent.sections.map((section, index) => (
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
						{section.additionalContent && (
							<p className="text-gray-700 leading-relaxed">
								{section.additionalContent}
							</p>
						)}
					</div>
				</section>
			))}

			{showLinks && (
				<section className="border border-blue-200 bg-blue-50/50 rounded-lg p-6 space-y-4">
					<h4 className="text-lg font-semibold text-blue-900">
						{privacyContent.links.title}
					</h4>
					<p className="text-sm text-blue-700">
						<strong>{privacyContent.links.description}</strong>
					</p>
					<div className="space-y-3">
						<Link
							href="/legal/privacy-policy"
							target="_blank"
							className="flex items-center justify-between p-4 rounded-lg border-2 border-blue-200 bg-white hover:bg-blue-50 hover:border-blue-300 transition-colors"
						>
							<div className="flex items-center gap-3">
								<Shield className="h-5 w-5 text-blue-600" />
								<span className="font-medium text-blue-900">
									{privacyContent.links.privacyPolicy}
								</span>
							</div>
							<ExternalLink className="h-5 w-5 text-blue-600" />
						</Link>
					</div>
					<p className="text-xs text-blue-600">{privacyContent.links.note}</p>
				</section>
			)}
		</div>
	);
}
