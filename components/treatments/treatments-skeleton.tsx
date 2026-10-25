import { Skeleton } from "@/components/ui/skeleton";

export function TreatmentsSkeleton() {
	return (
		<div className="p-4 space-y-6">
			<div className="space-y-3">
				<Skeleton className="h-6 w-36" />
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
	);
}
