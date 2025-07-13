import { Plus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { SubstanceUsageSection } from "./substance-usage-section";
import {
	getCachedSubstanceAggregations,
	getCachedSubstances,
	type ParcelWithTreatments,
} from "@/lib/data-fetcher";
import { requireAuth } from "@/lib/auth-utils";

interface HomeContentProps {
	parcels: ParcelWithTreatments[];
}

export async function HomeContent({ parcels }: HomeContentProps) {
	const session = await requireAuth();
	if (parcels.length === 0) {
		return (
			<div className="p-4">
				<Card>
					<CardHeader className="text-center">
						<CardTitle>Welcome to Agricolala</CardTitle>
						<CardDescription>
							To start managing your wineyard treatments, you need to add your
							first parcel.
						</CardDescription>
					</CardHeader>
					<CardContent className="text-center">
						<Button asChild className="bg-primary-600 hover:bg-primary-700">
							<Link href="/parcels">
								<Plus className="h-4 w-4 mr-2" />
								Add Your First Parcel
							</Link>
						</Button>
					</CardContent>
				</Card>
			</div>
		);
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

	return (
		<div className="p-4 space-y-4">
			<SubstanceUsageSection
				substanceData={enrichedSubstanceData}
				description="Track your substance applications across all parcels"
			/>
		</div>
	);
}
