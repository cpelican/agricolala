import Image from "next/image";
import Link from "next/link";
import { localizedPath, PUBLIC_PAGES } from "@/lib/site-url";
import type { TranslationType } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/locale";

export function SiteFooter({
	dict,
	locale,
}: {
	dict: TranslationType;
	locale: Locale;
}) {
	return (
		<footer className="mx-4 flex flex-col gap-1.5 border-t border-neutral-200 pt-5 pb-8 min-[900px]:mx-auto min-[900px]:max-w-[1152px] min-[900px]:flex-row min-[900px]:flex-wrap min-[900px]:items-center min-[900px]:justify-between min-[900px]:gap-3 min-[900px]:pt-6 min-[900px]:pb-10">
			<div className="flex items-center gap-2">
				<Image
					src="/1.png"
					alt=""
					width={40}
					height={43}
					className="size-[22px] object-contain min-[900px]:size-6"
				/>
				<span className="text-sm font-semibold">Agricolala</span>
			</div>
			<nav aria-label={dict.welcome.footerNav}>
				<ul className="m-0 flex list-none flex-wrap gap-x-5 p-0 text-[13px] leading-5">
					<li>
						<Link
							href={localizedPath(locale, PUBLIC_PAGES.privacyPolicy)}
							className="inline-block py-3 text-neutral-600 underline underline-offset-2 hover:text-neutral-900"
						>
							{dict.legal.privacyPolicy}
						</Link>
					</li>
					<li>
						<Link
							href={localizedPath(locale, PUBLIC_PAGES.termsOfService)}
							className="inline-block py-3 text-neutral-600 underline underline-offset-2 hover:text-neutral-900"
						>
							{dict.legal.termsOfService}
						</Link>
					</li>
				</ul>
			</nav>
		</footer>
	);
}
