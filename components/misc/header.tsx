export function Header({
	title,
	subtitle,
	children,
}: {
	title: string;
	subtitle?: string;
	children?: React.ReactNode;
}) {
	return (
		<div className="text-black/90 p-4 flex items-center justify-between gap-x-4">
			<div>
				<h1 className="text-xl font-semibold">{title}</h1>
				{subtitle && (
					<p className="font-light truncate max-w-[15rem]">{subtitle}</p>
				)}
			</div>
			{children}
		</div>
	);
}
