import { Skeleton } from "@/components/ui/skeleton";

export function HomeSkeleton() {
	return (
		<div className="p-4 space-y-4">
			<div className="space-y-4">
				<Skeleton className="h-100 w-full" />
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					{Array.from({ length: 3 }).map((_, i) => (
						<div key={i} className="space-y-2">
							<Skeleton className="h-4 w-24" />
							<Skeleton className="h-8 w-full" />
							<Skeleton className="h-3 w-16" />
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
