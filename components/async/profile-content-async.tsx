import { getTosStatus } from "@/app/actions/get-tos-status";
import { requireAuth } from "@/lib/auth-utils";
import { ProfileContent } from "../profile-content";

export async function ProfileContentAsync() {
	const session = await requireAuth();
	const tosStatus = await getTosStatus();
	return (
		<ProfileContent
			user={{
				name: session.user?.name || "",
				email: session.user?.email || "",
				image: session.user?.image || "",
			}}
			tosStatus={tosStatus}
		/>
	);
}
