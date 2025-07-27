import { SubstanceUsageSection } from "../substance-usage-section";
import {
	getCachedSubstanceAggregations,
	getCachedSubstances,
	type ParcelWithTreatments,
} from "@/lib/data-fetcher";
import { requireAuth } from "@/lib/auth-utils";
import { HomeContentUI } from "@/components/home-content-ui";
import { type Locale } from "@/lib/translations-helpers";
import { tServer } from "@/lib/translations-server-only";

interface HomeContentProps {
	parcelsPromise: Promise<ParcelWithTreatments[]>;
	locale: Locale;
}

export async function HomeContentAsync({
	parcelsPromise,
	locale,
}: HomeContentProps) {
	const parcels = await parcelsPromise;
	const session = await requireAuth();
	if (parcels.length === 0) {
		return <HomeContentUI />;
	}

	const substanceData = await getCachedSubstanceAggregations(
		session.user.id,
		new Date().getFullYear(),
	);
	const substances = await getCachedSubstances();

	const enrichedSubstanceData = substanceData.map((substance) => {
		const substanceMeta = substances.find((s) => s.name === substance.name);
		return {
			...substance,
			maxDosage: substanceMeta?.maxDosage || 0,
			color: substanceMeta?.color || "rgb(182, 182, 182)",
		};
	});
	const dict = tServer(locale);

	return (
		<div className="p-4 space-y-4">
			<SubstanceUsageSection
				substanceData={enrichedSubstanceData}
				description={dict.substances.trackApplicationsHome}
			/>
		</div>
	);
}
