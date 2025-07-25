import { defaultLocale } from "@/lib/translations-helpers";
import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth-utils";

export default async function RootPage() {
	const session = await requireAuth();
	redirect(`/${session.user.locale || defaultLocale}`);
}
