import { EYEBROW, PAGE_TITLE, SECTION_TEXT } from "@/components/ui/typography";

export function Header({
	title,
	eyebrow,
	subtitle,
	children,
}: {
	title: string;
	eyebrow?: string;
	subtitle?: string;
	children?: React.ReactNode;
}) {
	return (
		<div className="flex flex-col gap-2.5 px-4 pt-7 pb-4">
			{eyebrow && <p className={`m-0 ${EYEBROW}`}>{eyebrow}</p>}
			<div className="flex items-end justify-between gap-x-3">
				<h1 className={`${PAGE_TITLE} min-w-0 break-words`}>{title}</h1>
				{children && <div className="flex-none">{children}</div>}
			</div>
			{subtitle && <p className={SECTION_TEXT}>{subtitle}</p>}
		</div>
	);
}
