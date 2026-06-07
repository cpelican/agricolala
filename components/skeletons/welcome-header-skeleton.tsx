import { Skeleton } from "@/components/ui/skeleton";

/** Matches `Header` (p-4 + text-xl title) to avoid CLS while home content streams. */
export function WelcomeHeaderSkeleton() {
	return (
		<div className="flex items-center justify-between gap-x-4 p-4 text-black/90">
			<Skeleton className="h-7 w-56 max-w-[85vw]" />
		</div>
	);
}
