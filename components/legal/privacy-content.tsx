"use client";
import { Shield, ExternalLink } from "lucide-react";
import { LocaleLink } from "../locale/locale-link";
import { useTranslations } from "@/contexts/translations-context";

interface PrivacyContentProps {
	showLinks?: boolean;
}

export function PrivacyContent({ showLinks = false }: PrivacyContentProps) {
	const { t, getArray } = useTranslations();

	const privacySections = [
		{
			title: t("legal.privacy.sections.information.title"),
			content: getArray("legal.privacy.sections.information.content"),
			listItems: getArray("legal.privacy.sections.information.listItems"),
			additionalContent: t(
				"legal.privacy.sections.information.additionalContent",
			),
		},
		{
			title: t("legal.privacy.sections.usage.title"),
			content: t("legal.privacy.sections.usage.content"),
			listItems: getArray("legal.privacy.sections.usage.listItems"),
		},
		{
			title: t("legal.privacy.sections.sharing.title"),
			content: getArray("legal.privacy.sections.sharing.content"),
			listItems: getArray("legal.privacy.sections.sharing.listItems"),
		},
		{
			title: t("legal.privacy.sections.security.title"),
			content: t("legal.privacy.sections.security.content"),
			listItems: getArray("legal.privacy.sections.security.listItems"),
		},
		{
			title: t("legal.privacy.sections.retention.title"),
			content: getArray("legal.privacy.sections.retention.content"),
		},
		{
			title: t("legal.privacy.sections.rights.title"),
			content: t("legal.privacy.sections.rights.content"),
			listItems: getArray("legal.privacy.sections.rights.listItems"),
		},
		{
			title: t("legal.privacy.sections.cookies.title"),
			content: t("legal.privacy.sections.cookies.content"),
		},
		{
			title: t("legal.privacy.sections.children.title"),
			content: t("legal.privacy.sections.children.content"),
		},
		{
			title: t("legal.privacy.sections.international.title"),
			content: t("legal.privacy.sections.international.content"),
		},
		{
			title: t("legal.privacy.sections.changes.title"),
			content: t("legal.privacy.sections.changes.content"),
		},
		{
			title: t("legal.privacy.sections.contact.title"),
			content: t("legal.privacy.sections.contact.content"),
		},
	];
	return (
		<div className="space-y-6">
			{privacySections.map((section, index) => (
				<section key={index} className="space-y-3">
					<h4 className="text-lg font-semibold text-gray-900">
						{section.title}
					</h4>
					<div className="space-y-3">
						{typeof section.content === "string" ? (
							<p className="text-gray-700 leading-relaxed">{section.content}</p>
						) : (
							section.content.map((paragraph: string, pIndex: number) => (
								<p key={pIndex} className="text-gray-700 leading-relaxed">
									{paragraph}
								</p>
							))
						)}
						{section.listItems && (
							<ul className="list-disc pl-6 space-y-2 text-gray-700">
								{section.listItems.map((item: string, itemIndex: number) => (
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
						{t("legal.privacy.links.title")}
					</h4>
					<p className="text-sm text-blue-700">
						<strong>{t("legal.privacy.links.description")}</strong>
					</p>
					<div className="space-y-3">
						<LocaleLink
							href="/legal/privacy-policy"
							target="_blank"
							className="flex items-center justify-between p-4 rounded-lg border-2 border-blue-200 bg-white hover:bg-blue-50 hover:border-blue-300 transition-colors"
						>
							<div className="flex items-center gap-3">
								<Shield className="h-5 w-5 text-blue-600" />
								<span className="font-medium text-blue-900">
									{t("legal.privacy.links.privacyPolicy")}
								</span>
							</div>
							<ExternalLink className="h-5 w-5 text-blue-600" />
						</LocaleLink>
					</div>
					<p className="text-xs text-blue-600">
						{t("legal.privacy.links.note")}
					</p>
				</section>
			)}
		</div>
	);
}
