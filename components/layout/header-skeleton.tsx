import { Skeleton } from "@/components/ui/skeleton";

/** Matches `Header` (pt-7 pb-4 + 30px title) to avoid CLS while home content streams. */
export function HeaderSkeleton() {
	return (
		<div className="flex flex-col gap-2.5 px-4 pt-7 pb-4">
			<Skeleton className="h-4 w-28" />
			<Skeleton className="h-8 w-56 max-w-[85vw]" />
		</div>
	);
}
