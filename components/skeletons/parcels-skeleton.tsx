import { Skeleton } from "@/components/ui/skeleton";

export function ParcelsSkeleton() {
	return (
		<div className="p-4 space-y-4">
			<div className="space-y-2">
				<Skeleton className="h-4 w-32 ml-auto" />
				<Skeleton className="h-90 w-full rounded-lg" />
			</div>

			<div className="grid gap-4">
				{Array.from({ length: 3 }).map((_, i) => (
					<div key={i} className="p-4 border rounded-lg space-y-3">
						<Skeleton className="h-5 w-32" />
						<Skeleton className="h-4 w-24" />
						<Skeleton className="h-4 w-20" />
						<div className="flex items-center space-x-2">
							<Skeleton className="h-4 w-4" />
							<Skeleton className="h-3 w-32" />
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
