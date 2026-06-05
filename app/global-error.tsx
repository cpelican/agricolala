"use client";

import { useEffect } from "react";

interface GlobalErrorProps {
	error: Error & { digest?: string };
	reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
	useEffect(() => {
		console.error("Global error:", error);
	}, [error]);

	return (
		<html lang="en">
			<body className="min-h-screen bg-background p-4 font-sans text-foreground">
				<main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 text-center">
					<h1 className="text-2xl font-semibold">Something went wrong</h1>
					<p className="text-sm text-muted-foreground">
						An unexpected error occurred. Please try again.
					</p>
					<button
						type="button"
						onClick={reset}
						className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
					>
						Try again
					</button>
				</main>
			</body>
		</html>
	);
}
