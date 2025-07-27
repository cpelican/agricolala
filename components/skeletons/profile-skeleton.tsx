import { Skeleton } from "../ui/skeleton";

export function ProfileSkeleton() {
	return (
		<div className="p-4 space-y-6">
			<div className="space-y-4">
				<Skeleton className="h-6 w-32" />
				<div className="flex items-center space-x-4">
					<Skeleton className="h-16 w-16 rounded-full" />
					<div className="space-y-2">
						<Skeleton className="h-5 w-40" />
						<Skeleton className="h-4 w-48" />
					</div>
				</div>
			</div>
			<div className="space-y-4">
				<Skeleton className="h-6 w-24" />
				<div className="space-y-3">
					{Array.from({ length: 2 }).map((_, i) => (
						<div
							key={i}
							className="flex justify-between items-center p-3 border rounded-lg"
						>
							<div className="space-y-1">
								<Skeleton className="h-10 w-32" />
								<Skeleton className="h-15 w-48" />
							</div>
							<Skeleton className="h-6 w-12" />
						</div>
					))}
				</div>
			</div>
			<div className="space-y-4">
				<Skeleton className="h-6 w-40" />
				<div className="p-4 border rounded-lg space-y-3">
					<Skeleton className="h-4 w-full" />
					<Skeleton className="h-4 w-3/4" />
					<Skeleton className="h-4 w-1/2" />
				</div>
			</div>
		</div>
	);
}
