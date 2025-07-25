"use client";

import { FileText, Shield, ExternalLink } from "lucide-react";
import { LocaleLink } from "./locale-link";
import { useTranslations } from "@/hooks/use-translations";

interface TosContentProps {
	showLinks?: boolean;
}

export function TosContent({ showLinks = false }: TosContentProps) {
	const { t, getArray } = useTranslations();

	const tosSections = [
		{
			title: t("legal.tos.sections.acceptance.title"),
			content: t("legal.tos.sections.acceptance.content"),
		},
		{
			title: t("legal.tos.sections.description.title"),
			content: t("legal.tos.sections.description.content"),
			listItems: getArray("legal.tos.sections.description.listItems"),
		},
		{
			title: t("legal.tos.sections.responsibilities.title"),
			content: t("legal.tos.sections.responsibilities.content"),
			listItems: getArray("legal.tos.sections.responsibilities.listItems"),
		},
		{
			title: t("legal.tos.sections.compliance.title"),
			content: t("legal.tos.sections.compliance.content"),
			listItems: getArray("legal.tos.sections.compliance.listItems"),
		},
		{
			title: t("legal.tos.sections.dataOwnership.title"),
			content: getArray("legal.tos.sections.dataOwnership.content"),
		},
		{
			title: t("legal.tos.sections.liability.title"),
			content: t("legal.tos.sections.liability.content"),
			listItems: getArray("legal.tos.sections.liability.listItems"),
		},
	];
	return (
		<div className="space-y-6">
			{tosSections.map((section, index) => (
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
					</div>
				</section>
			))}

			{showLinks && (
				<section className="border border-blue-200 bg-blue-50/50 rounded-lg p-6 space-y-4">
					<h4 className="text-lg font-semibold text-blue-900">
						{t("legal.tos.links.title")}
					</h4>
					<p className="text-sm text-blue-700">
						<strong>{t("legal.tos.links.description")}</strong>
					</p>
					<div className="space-y-3">
						<LocaleLink
							href="/legal/terms-of-service"
							target="_blank"
							className="flex items-center justify-between p-4 rounded-lg border-2 border-blue-200 bg-white hover:bg-blue-50 hover:border-blue-300 transition-colors"
						>
							<div className="flex items-center gap-3">
								<FileText className="h-5 w-5 text-blue-600" />
								<span className="font-medium text-blue-900">
									{t("legal.tos.links.termsOfService")}
								</span>
							</div>
							<ExternalLink className="h-5 w-5 text-blue-600" />
						</LocaleLink>
						<LocaleLink
							href="/legal/privacy-policy"
							target="_blank"
							className="flex items-center justify-between p-4 rounded-lg border-2 border-blue-200 bg-white hover:bg-blue-50 hover:border-blue-300 transition-colors"
						>
							<div className="flex items-center gap-3">
								<Shield className="h-5 w-5 text-blue-600" />
								<span className="font-medium text-blue-900">
									{t("legal.tos.links.privacyPolicy")}
								</span>
							</div>
							<ExternalLink className="h-5 w-5 text-blue-600" />
						</LocaleLink>
					</div>
					<p className="text-xs text-blue-600">{t("legal.tos.links.note")}</p>
				</section>
			)}
		</div>
	);
}
