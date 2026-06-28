import { ChartSkeleton } from "@/components/substances/chart-wrapper";
import { WelcomeHeaderSkeleton } from "@/components/skeletons/welcome-header-skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface HomeSkeletonProps {
	ariaLabel: string;
	variant?: "empty" | "dashboard";
}

export function HomeEmptyBodySkeleton() {
	return (
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
	);
}

export function HomeDashboardBodySkeleton() {
	return (
		<div className="space-y-4 p-4">
			<Card className="bg-card">
				<CardHeader className="space-y-2">
					<Skeleton className="h-6 w-48" />
					<Skeleton className="h-4 w-full max-w-md" />
				</CardHeader>
				<CardContent>
					<ChartSkeleton />
				</CardContent>
			</Card>

			<div className="grid gap-4">
				<Skeleton className="h-7 w-44" />
				<Card>
					<CardContent className="p-4">
						<div className="flex items-center justify-between gap-2">
							<div className="flex flex-1 items-center gap-2">
								<Skeleton className="size-4 shrink-0 rounded-full" />
								<div className="flex-1 space-y-2">
									<Skeleton className="h-5 w-28" />
									<Skeleton className="h-4 w-full" />
									<Skeleton className="h-4 w-5/6" />
									<Skeleton className="h-4 w-2/3" />
								</div>
							</div>
							<div className="space-y-2 text-right">
								<Skeleton className="ml-auto h-3 w-20" />
								<Skeleton className="h-2 w-16" />
							</div>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}

export function CoverageWidgetSkeleton() {
	return (
		<div className="space-y-3">
			<Card className="bg-card">
				<CardHeader className="space-y-2">
					<Skeleton className="h-6 w-44" />
					<Skeleton className="h-4 w-72 max-w-full" />
				</CardHeader>
			</Card>
			{[0, 1].map((i) => (
				<Card key={i}>
					<CardContent className="p-4 space-y-3">
						<div className="flex items-start justify-between gap-3">
							<div className="flex items-center gap-2">
								<Skeleton className="w-3 h-3 rounded-full shrink-0" />
								<div className="space-y-1">
									<Skeleton className="h-5 w-24" />
									<Skeleton className="h-4 w-40" />
								</div>
							</div>
							<Skeleton className="h-2 w-16 rounded-full" />
						</div>
					</CardContent>
				</Card>
			))}
		</div>
	);
}

export function HomeSkeleton({
	ariaLabel,
	variant = "empty",
}: HomeSkeletonProps) {
	return (
		<div role="status" aria-busy="true" aria-label={ariaLabel}>
			<WelcomeHeaderSkeleton />
			{variant === "dashboard" ? (
				<HomeDashboardBodySkeleton />
			) : (
				<HomeEmptyBodySkeleton />
			)}
		</div>
	);
}
