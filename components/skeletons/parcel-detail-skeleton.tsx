import { Skeleton } from "@/components/ui/skeleton";

export function ParcelDetailSkeleton() {
	return (
		<div className="space-y-6">
			<div className="space-y-4">
				<div className="flex justify-between items-start">
					<div className="space-y-2">
						<Skeleton className="h-6 w-48" />
						<Skeleton className="h-4 w-32" />
						<Skeleton className="h-4 w-24" />
					</div>
					<Skeleton className="h-8 w-24" />
				</div>
			</div>

			<div className="space-y-4">
				<Skeleton className="h-6 w-40" />
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					{Array.from({ length: 4 }).map((_, i) => (
						<div key={i} className="space-y-2">
							<Skeleton className="h-4 w-20" />
							<Skeleton className="h-8 w-full" />
							<Skeleton className="h-3 w-16" />
						</div>
					))}
				</div>
			</div>

			<div className="space-y-4">
				<Skeleton className="h-6 w-32" />
				<div className="space-y-3">
					{Array.from({ length: 2 }).map((_, i) => (
						<div key={i} className="p-4 border rounded-lg space-y-3">
							<div className="flex justify-between items-start">
								<div className="space-y-2 flex-1">
									<Skeleton className="h-5 w-40" />
									<Skeleton className="h-4 w-32" />
									<Skeleton className="h-4 w-24" />
								</div>
								<Skeleton className="h-8 w-20" />
							</div>
							<div className="flex space-x-2">
								<Skeleton className="h-6 w-16 rounded-full" />
								<Skeleton className="h-6 w-20 rounded-full" />
							</div>
						</div>
					))}
				</div>
			</div>

			<div className="h-64">
				<Skeleton className="h-full w-full rounded-lg" />
			</div>
		</div>
	);
}
