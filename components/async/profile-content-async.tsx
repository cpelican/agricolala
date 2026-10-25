import { getTosStatus } from "@/lib/actions-tos";
import { requireAuth } from "@/lib/auth-utils";
import { ProfileContent } from "../misc/profile-content";

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
