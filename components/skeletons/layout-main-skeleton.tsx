import { WelcomeHeaderSkeleton } from "@/components/skeletons/welcome-header-skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/** Neutral main-area placeholder while reference data loads in the layout. */
export function LayoutMainSkeleton() {
	return (
		<>
			<WelcomeHeaderSkeleton />
			<div className="p-4">
				<Card>
					<CardHeader className="space-y-2 text-center">
						<Skeleton className="mx-auto h-6 w-32" />
						<Skeleton className="mx-auto h-4 w-64 max-w-full" />
					</CardHeader>
					<CardContent className="text-center">
						<Skeleton className="mx-auto h-10 w-40 rounded-md" />
					</CardContent>
				</Card>
			</div>
		</>
	);
}
