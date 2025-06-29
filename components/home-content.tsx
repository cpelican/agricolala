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
import { calculateSubstanceData } from "@/lib/substance-helpers";
import { type ParcelWithTreatments } from "@/lib/data-fetcher";

interface HomeContentProps {
	parcels: ParcelWithTreatments[];
}

export async function HomeContent({ parcels }: HomeContentProps) {
	if (parcels.length === 0) {
		return (
			<div className="p-4">
				<Card>
					<CardHeader className="text-center">
						<CardTitle>Welcome to Agricolala</CardTitle>
						<CardDescription>
							To start managing your vineyard treatments, you need to add your
							first parcel.
						</CardDescription>
					</CardHeader>
					<CardContent className="text-center">
						<Button asChild className="bg-green-600 hover:bg-green-700">
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

	const allTreatments = parcels.flatMap((parcel: ParcelWithTreatments) =>
		parcel.treatments.map((treatment) => ({
			...treatment,
			parcel: {
				width: parcel.width,
				height: parcel.height,
			},
			parcelName: parcel.name,
		})),
	);
	const substanceData = calculateSubstanceData(allTreatments);

	return (
		<div className="p-4 space-y-4">
			<SubstanceUsageSection
				substanceData={substanceData}
				description="Track your substance applications across all parcels"
			/>
		</div>
	);
}
